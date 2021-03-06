/**
 * 搭建好了集群,充分利用了多核 CPU 资源, 似乎就可以迎接客户端大量的请求了.
 * 但请等等, 我们还有一些细节需要考虑.
 * > 性能问题.
 * > 多个工作进程的存活状态管理.
 * > 工作进程的平滑重启.
 * > 配置或者静态数据的动态重新载入.
 * > 其他细节
 * 
 * 是的, 虽然我们创建了很多工作进程, 但每个工作进程依然是在单线程上执行的,它的稳定性
 * 还不能得到完全的保障. 我们需要建立起一个健全的机制来保障Node应用的健壮性.
 * 
 * 1. 进程事件
 * 再次回归到子进程对象上, 除了引入关注的 send() 方法和 message 事件外, 子进程还有些
 * 什么呢? 首先除了 message 事件外, Node 还有如下这些事件.
 * 
 * > error: 当子进程无法被复制创建, 无法被杀死, 无法发送消息时会触发该事件.
 * 
 * > exit: 子进程退出时触发该事件, 子进程如果是正常退出, 这个事件的第一个参数为退出码,否则为null.
 * 如果进程是通过kill()方法被杀死的, 会得到第二个参数, 它表示杀死进程时的信号.
 * 
 * > close: 在子进程的标准输入输出流中止时触发该事件,参数与exit相同.
 * 
 * > disconnect: 在父进程或子进程中调用 disconnect() 方法时触发该事件, 在调用该方法时将关闭监听
 * IPC通道.
 * 
 * 上述这些事件是父进程能监听到的与子进程相关的事件. 除了 send() 外, 还能通过 kill() 方法给子进程
 * 发送消息. kill() 方法并不能真正地将通过IPC 相连的子进程杀死, 它只是给子进程发送了一个系统信号.
 * 默认情况下, 父进程将通过 kill() 方法给子进程发送一个 SIGTERM 信号. 它与进程默认的 kill() 方法
 * 类似,如下
 * 
 * //子进程
 * child.kill([signal]);
 * //当前进程
 * process.kill(pid, [signal]);
 * 
 * 它们一个发给子进程, 一个发给目标进程. 在POSIX标准中, 有一套完备的信号系统,在命令行中执行 kill -l
 * 可以看到详细的信号列表,如下
 * > kill -l
 * 
 * Node 提供了这些信号对应的信号事件, 每个进程都可以监听这些信号事件. 这些信号事件是用来通知进程的,每个
 * 信号事件有不同的含义, 进程在收到响应信号时, 应当做出约定的行为,如 SIGTERM 的软件中止信号,进程收到
 * 该信号时应当退出.如下
 * process.on('SIGTERM', function(){
 *     console.log('Got a SIGTERM, exiting...');
 *     process.exit(1);
 * });
 * 
 * console.log('server running with PID:', process.pid);
 * process.kill(process.pid, 'SIGTERM');
 */

/**
 * 2. 自动重启
 * 有了父子进程之间的相关事件之后, 就可以在这些关系之间创建出需要的机制了. 至少我们能够通过
 * 监听子进程的exit事件来获知其退出的信息, 接着前文的多进程架构, 我们在主进程上要加入一些子
 * 进程管理的机制, 比如重新启动一个工作进程来继续服务.如下
 * 
 *                 | 主进程 |
 *          /     |    \     \     \
 *      重新复制   退出   \     \     \
 *        /        \     \     \     \
 *   | 工作 | <- | 工作 | 工作 | 工作 | 工作 |
 *   | 进程 |    | 进程 | 进程 | 进程 | 进程 |
 * 
 * 主进程加入子进程管理机制, 如下
 * // master.js
 * 
 * 通过kill命令杀死某个进程试试,如下: 
 * > kill 5830
 * 结果是 5830 进程退出后, 自动启动了一个新的工作进程 5860, 总体进程数量并没有发生改变,如下
 * Worker 5830 exited.
 * Create worker. pid: 5860
 * 
 * 在这个场景中我们主动杀死了一个进程, 在实际业务中, 可能有隐藏的bug导致工作进程退出,那么我们需要仔细地处理
 * 这种异常,如下
 * worker02.js
 * 
 * 上述代码的处理流程是, 一旦有未捕获的异常出现, 工作进程就会立即停止接收新的连接; 当所有连接断开后,退出进程.
 * 主进程在侦听到工作进程的 exit 后, 将会立即启动新的进程服务, 以此保证整个集群中总是有进程在为用户服务的.
 */

/**
 * 2.1 自杀信号
 * 当然上述代码存在的问题是要等到已有的所有连接断开后进程才退出, 在极端的情况下, 所有工作进程都停止接收新的连接,
 * 全处在等待退出的状态. 但在等到进程完全退出才重启的过程中,所有新来的请求可能存在没有工作进程为新用户服务的情景,
 * 这会丢掉大部分请求.
 * 
 * 为此需要改进这个过程,不能等到工作进程退出后才重启新的工作进程. 当然也不能暴力退出进程, 因为这样会导致已连接的
 * 用户直接断开. 于是我们在退出的流程中增加一个自杀(suicide) 信号. 工作进程在得知要退出时, 向主进程发送一个自杀
 * 信号,然后才停止接收新的连接, 当所有连接断开后才退出. 主进程在接收到自杀信号后, 立即创建新的工作进程服务.
 * 改动如下: 
 * // worker.js
 * process.on('uncaughtException', function(err){
 *    process.send({act: 'suicide'});
 *    //停止接收新的连接
 *    worker.close(function(){
 *       //所有已有连接断开后, 退出进程
 *       process.exit(1);
 *    });
 * });
 * 
 * 主进程将重启工作进程的任务, 从exit事件的处理函数中转移到message事件的处理函数中,如下
 * var createWorker = function(){
 *     var worker = fork(__dirname + '/worker.js');
 *     //启动新的进程
 *     worker.on('message', function(message){
 *         if(message.act === 'suicide'){
 *            createWorker();
 *         }
 *     });
 *     worker.on('exit', function(){
 *         console.log('Worker ' + worker.pid + ' exited.');
 *         delete workers[worker.pid];
 *     });
 *     worker.send('server', server);
 *     workers[worker.pid] = worker;
 *     console.log('Create worker. pid: ' + worker.pid);
 * };
 * 
 * 为了模拟未捕获的异常, 我们将工作进程的处理代码改为抛出异常,一旦有用户请求,就会有一个可伶的工作进程退出,如下
 * var server = http.createServer(function(req,res){
 *    res.writeHead(200, {'Content-Type': 'text/plain'});
 *    res.end('handled by child, pid is ' + process.pid + '\n');
 *    throw new Error('throw exception');
 * });
 * 
 * 用curl工具测试效果,如下
 * > curl http://127.0.0.1:1337/
 * handled by child, pid is 6167
 * 再回头看重启信息,如下
 * Create worker. pid: 6182
 * Worker 6167 exited.
 * 
 * 与前一种方案相比, 创建新工作进程在前, 退出异常进程在后. 在这个可伶的异常进程退出之前, 总是有新的工作进程来替
 * 上它的岗位. 至此我们完成了进程的平滑重启, 一旦有异常出现, 主进程会创建新的工作进程来为用户服务, 旧的进程一旦处理
 * 完已有连接就自动断开. 整个过程使得我们的应用的稳定性和健壮性大大提高.如下示意图
 * 
 *                | 主进程 |
 *              /    ^ \   \   \
 *             /     |  \   \   \
 *        重新复制   自杀  \   \   \
 *          /         \   \   \   \
 *         V          V    V   V   V
 *       工作 <----- 工作  工作 工作  工作
 *       进程        进程  进程 进程  进程
 *                    |
 *                    V
 *                   退出
 * 
 * 进程的自杀 和 重启
 * 
 * 这里存在问题的是有可能我们的连接是长连接, 不是 HTTP 服务的这种短连接, 等待长连接断开可能需要较久的时间. 为此
 * 为已有连接的断开设置一个超时时间是必要的, 在限定时间里强制退出的设置如下: 
 * process.on('uncaughtException', function(err){
 *    process.send({act: 'suicide'});
 *    // 停止接收新的连接
 *    worker.close(function() {
 *      // 所有已有连接断开后,退出进程
 *      process.exit(1);
 *    });
 *    // 5 s后退出进程
 *    setTimeout(function(){
 *       process.exit(1);
 *    });
 * });
 * 
 * 进程中如果出现未能捕获的异常, 就意味着有那么一段代码在健壮性上是不合格的. 为此退出进程前, 通过日志记录下问题所在是必须
 * 要做的事情, 它可以帮我们很好地定位和追踪代码异常出现的位置,如下.
 * process.on('uncaughtException', function(err) {
 *    // 记录日志
 *    logger.error(err);
 *    // 发送自杀信号
 *    process.send({act: 'suicide'});
 *    // 停止接收新的连接
 *    worker.close(function(){
 *      // 所有已有连接断开后, 退出进程
 *      process.exit(1);
 *    });
 *    // 5秒后退出进程
 *    setTimeout(function(){
 *      process.exit(1);
 *    },5000);
 * });
 */

/**
 * 2.2 限量重启
 * 通过自杀信号告知主进程可以使得新连接总是有进程服务, 但是依然还是有极端的情况.
 * 工作进程不能无限制地被重启, 如果启动的过程中就发生了错误, 或者启动后接到连接
 * 就收到错误, 会导致工作进程被频繁重启, 这种频繁重启不属于我们捕捉未知异常的情况,
 * 因为这种短时间内频繁重启已经不符合预期的设置, 既有可能是程序编写的错误.
 * 
 * 为了消除这种无意义的重启,在满足一定规则的限制下, 不应当反复重启. 比如在单位时间
 * 内规定只能重启多少次, 超过限制就触发giveup 事件, 告知放弃重启工作进程这个重要
 * 事件.
 * 
 * 为了完成限量重启的统计, 我们引入一个队列来做标记, 在每次重启工作进程之间进程打点并
 * 判断重启是否太过频繁,如下: 
 * 
 * // 重启次数
 * var limit = 10;
 * // 时间单位
 * var during = 60000;
 * var restart = [];
 * var isTooFrequently = function() {
 *   // 记录重启时间
 *   var time = Date.now();
 *   var length = restart.push(time);
 *   if(length > limit) {
 *     // 取出最后10个记录
 *     restart = restart.slice(limit * -1);
 *   }
 *   // 最后一次重启到前10次重启之间的时间间隔
 *   return restart.length >= limit && restart[restart.length - 1] - restart[0] < during;
 * };
 * 
 * giveup 事件是比 uncaughtException 更严重的异常事件. uncaughtException 只代表集群中某个工作进程退出,
 * 在整体性保证下, 不会出现用户得不到服务的情况, 但是这个 giveup 事件则表示集群中没有任何进程服务了, 十分危险.
 * 为了健壮性考虑, 我们应在 giveup 事件中添加重要日志, 并让监控系统监视到这个严重错误,进而报警等.
 */

/**
 * 3. 负载均衡
 * 在多进程之间监听相同的端口, 使得用户请求能够分散到多个进程上进程处理, 这带来的好处是可以将CPU资源都调用起来. 这犹如
 * 饭店将客人的点单分发给多个厨师进行餐点制作. 既然涉及多个厨师共同处理所有菜单, 那么保证每个厨师的工作量是一门学问,即
 * 不能让一些厨师忙不过来, 也不能让一些厨师闲着, 这种保证多个处理单元工作量公平的策略叫负载均衡.
 * 
 * Node默认提供的机制是采用操作系统的抢占式策略. 所谓的抢占式就是在一堆工作进程中, 闲着的进程对到来的请求进程争抢,
 * 岁抢到谁服务.
 * 
 * 一般而言, 这种抢占式策略对大家是公平的, 各个进程可以根据自己的繁忙度来进程抢占. 但是对于Node而言, 需要分清的是它
 * 的繁忙是由CPU, I/O 两个部分构成的, 影响抢占的是CPU的繁忙度. 对不同的业务, 可能存在I/O繁忙, 而CPU较为空闲的情况,
 * 这可能造成某个进程能能够抢到较多请求, 形成负载不均衡的情况.
 * 
 * 为此Node在 v0.11 中提供了一种新的策略使得负载均衡更合理, 这种新的策略叫 Round-Robin, 又叫轮叫调度. 轮叫调度的工作
 * 方式是由主进程接收连接, 将其依次分发给工作进程. 分发的策略是在N个工作进程中, 每次选择第 i = (i + 1) mod n 个进程
 * 来发送连接. 在 cluster 模块中启用它的方式如下: 
 * 
 * // 启用Round-Robin
 * cluster.schedulingPolicy = cluster.SCHED_RR
 * // 不启用Round-Robin
 * cluster.schedulingPolicy = cluster.SCHED_NONE
 * 
 * 或者在环境变量中设置 NODE_CLUSTER_SCHED_POLICY 的值, 如下所示: 
 * export NODE_CLUSTER_SCHED_POLICY = rr
 * export NODE_CLUSTER_SCHED_POLICY = none
 * 
 * Round-Robin 非常简单, 可以避免CPU 和 I/O 繁忙差异导致的负载不均衡. Round-Robin 策略也可以通过代理服务器来实现, 但是它
 * 会导致服务器上消耗的文件描述符是平常方式的两倍.
 */


/**
 * 4. 状态共享
 * 在第5章中, 我们提到在Node进程中不宜存放太多数据, 因为它会加重垃圾回收的负担,进而影响性能. 同时, Node 也不允许在多个进程之间
 * 共享数据. 但在实际的业务中, 往往需要共享些一些数据,譬如配置数据,这在多个进程中应当是一致的. 为此, 在不允许共享数据的情况下,
 * 我们需要一种方案 和 机制来实现数据在多个进程之间的共享.
 * 
 * 4.1 第三方数据存储
 * 解决数据共享最直接, 简单的方式就是通过第三方来进行数据存储, 比如将数据存放到数据库, 磁盘文件, 缓存服务(如 Redis ) 中, 所有工作
 * 进程启动时将其读取进内存中. 但这种方式存在的问题是如果数据发生改变, 还需要一种机制通知到各个子进程, 使得它们的内部状态也得到更新.
 * 
 * 定时轮询带来的问题是轮询时间不能过密, 如果子进程过多, 会形成并发处理, 如果数据没有发生改变, 这些轮询会没有意义, 白白增加查询状态
 * 的开销. 如果轮询时间过长, 数据发生改变时, 不能及时更新到子进程中, 会有一定的延迟.
 * 
 *                                      | 主进程 |
 *                                          |
 *        ---------------------------------------------------------------------
 *        |                   |                         |                      |
 *  | 工作进程 |           | 工作进程 |               | 工作进程 |            | 工作进程 |
 *      ^                      ^                        ^                      ^
 *      \                       \                       /                      /
 *       V                      V                       V                     V
 *                         |  config  ( db / file / cache )  |
 * 
 * 定时轮询示意图
 * 
 * 4.2 主动通知
 * 一种改进的方式是当数据发生更新时, 主动通知子进程. 当然, 即使是主动通知, 也需要一种机制来及时获取数据的改变. 这个过程仍然不能
 * 脱离轮询, 但我们可以减少轮询的进程数量, 我们将这种用来发送通知和查询状态是否更改的进程叫做 通知进程. 为了不混合业务逻辑,可以将
 * 这个进程设计为之进行轮询和通知, 不处理任何业务逻辑, 示意图如下: 
 * 
 *                                       | 主进程 |
 *                                           |
 *        ------------------------------------------------------------------------
 *        |                   |                          |                       |
 *   | 工作进程 |         | 工作进程 |                 | 工作进程 |              | 工作进程 |
 *        ^\                  ^\                         /^                      /^
 *           \                   \                     /                        /
 *           |-------------------------------------------------------------------|
 *           |                        通知                                        |
 *           |-------------------------------------------------------------------|
 *                                      ^
 *                                      |
 *                                      V
 *                       | config ( db / file / cache ) |
 * 主动通知示意图
 * 
 * 这种推送机制如果按进程间信号传递, 在跨多台服务器时会无效, 事故可以考虑采用TCP或UDP的方案, 进程在启动时从通知服务处除了读取
 * 第一次数据外, 还将进程信息注册到通知服务处.  一旦通过轮询发现有数据更新后, 根据注册信息, 将更新后的数据发送给工作进程. 由于
 * 不涉及太多进程去向同一地方进行状态查询, 状态响应处的压力不至于太过巨大, 单一的通知服务轮询带来的压力并不大, 所以可以将轮询
 * 时间调整的较短, 一旦发现更新, 就能实时地推送到各个子进程中.
 */