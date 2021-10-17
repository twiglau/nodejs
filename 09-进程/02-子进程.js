/**
 * 1. 创建子进程
 * child_process 模块给予 Node 可以随意创建子进程(child_process)的能力. 它提供了 4 个方法用于创建子进程
 * > spawn(): 启动一个子进程来执行命令.
 * > exec(): 启动一个子进程来执行命令, 与 spawn() 不同的是其接口不同, 它有一个回调函数获知子进程的状况.
 * > execFile(): 启动一个子进程来执行可执行文件.
 * > fork(): 与spawn()类似, 不同点在于它创建Node的子进程 只需指定要执行的 JavaScript 文件模块即可.
 * 
 * spawn() 与 exec(), execFile() 不同的是, 后两者创建时可以指定timeout属性设置超时时间, 一旦创建的进程运行
 * 超过设定的时间将会被杀死.
 * 
 * exec() 与 execFile() 不同的是, exec()适合执行已有的命令,execFile()适合执行文件. 这里我们以一个寻常命令为例,
 * node worker.js 分别用上述4种方法实现,如下
 * var cp = require('child_process');
 * cp.spawn('node',['worker.js']);
 * cp.exec('node worker.js', function(err,stdout,stderr){
 *     // some code
 * });
 * cp.execFile('worker.js',function(err,stdout,stderr){
 *     // some code
 * });
 * cp.fork('./worker.js');
 * 
 * 以上4个方法在创建子进程之后均会返回子进程对象. 其差别可以通过以下查看.
 * 
 * |  类型  |  回调/异常  |  进程类型  |  执行类型  |  可设置超时  |
 * |------- |-----------|----------|-----------|-------------|
 * | spawn()| X         |  任意      |  命令     |   X        |
 * |--------|-----------|-----------|-----------|------------|
 * | exec() |  ✔️       |  任意      |  命令     |    ✔️       |
 * |--------|-----------|-----------|-----------|------------|
 * |execFile()|  ✔️     |  任意      |可执行文件   |   ✔️       |
 * |--------|-----------|-----------|-----------|------------|
 * |fork()  |  X        |  Node     |JavaScript文件|  X       |
 * |--------|-----------|-----------|------------|-----------|
 * 
 * 这里的可执行文件是值可以直接执行的文件, 如果是JavaScript文件通过execFile()
 * 运行, 它的首行内容必须添加如下代码: 
 * #! /usr/bin/env node
 * 
 * 尽管4种创建子进程的方式有些差别, 但事实上后面3中方法都是 spawn() 的延伸应用.
 */


/**
 * 2. 进程间通信
 * 在Master-Worker模式中, 要实现主进程管理和调度工作进程的功能,需要主进程和工作进程之间的通信.
 * 对于child_process模块,创建好了子进程, 然后与父子进程间通信是十分容易的.
 * 
 * 在前端浏览器中, JavaScript主线程与UI渲染公用同一个线程. 执行JavaScript的时候UI渲染是停滞的,
 * 渲染UI时, JavaScript是停滞的, 两者互相阻塞. 长时间执行JavaScript将会造成UI停顿不响应.为了
 * 解决这个问题,HTML5提出了WebWorker API. WebWorker允许创建工作线程并在后台运行, 使得一些阻塞
 * 较为严重的计算不影响主线程上的UI渲染. 它的API如下
 * 
 * var worker = new Worker('worker.js');
 * worker.onmessage = function(event){
 *    document.getElementById('result').textContent = event.data;
 * };
 * 
 * 其中, worker.js 如下所示: 
 * var n = 1;
 * search: while(true) {
 *    n += 1;
 *    for(var i = 2; i <= Math.sqrt(n); i += 1)
 *       if( n%i == 0)
 *       continue search;
 *       // found a prime
 *    postMessage(n);
 * }
 * 
 * 主线程与工作线程之间通过 onmessage() 和 postMessage() 进行通信, 子进程对象则由 send() 方法实现主进程
 * 向子进程发送数据, message 事件实现收听子进程发来的数据, 与API在一定程度上相似. 通过消息传递内容,而不是共享
 * 或直接操作相关资源, 这是较为轻量和无依赖的做法.
 * 
 * Node中对应示例如下
 * parent.js  和 sub.js
 * 
 * 通过fork()或者其他API, 创建子进程之后, 为了实现父子进程之间的通信, 父进程与子进程之间将会创建IPC通道. 通过
 * IPC通道, 父子进程之间才能通过 message 和 send() 传递消息.
 * 
 * > 进程间通信原理
 * IPC的全称是 Inter-Process Communication, 即进程间通信. 进程间通信的目的是为了让不同的进程能够互相访问资源
 * 并进行协调工作. 实现进程间通信的技术有很多, 如命名管道, 匿名管道, socket, 信号量, 共享内存, 消息队列, Domain
 * Socket 等.
 * 
 * Node中实现IPC通道的是管道(pipe)技术. 但此管道非彼管道, 在Node中管道是个抽象层面的称呼, 具体细节实现有libuv提供,
 * 在Windows下由命名管道(named pipe)实现, *nix 系统则采用 Unix Domain Socket 实现. 表现在应用层上的进程间通信
 * 只有简单的 message 事件 和 send() 方法, 接口十分简洁 和 消息化. IPC 创建和实现的示意图
 * 
 *   | 父进程  |<----------  IPC  ---------->|  子进程  |
 *                           |
 *                           |
 *                           V
 *                   |   (libuv) 管道  | 
 *                   ------------------ 
 *                    /               \
 *                   /                 \
 *                  <                   >
 *       | (Windows)  |          |   (*nix)      |
 *       |  命名管道   |          | Domain Socket |
 *       --------------          -----------------
 * 
 * 父进程在实际创建子进程之前, 会创建IPC通道并监听它, 然后才真正创建出子进程, 并通过环境变量(NODE_CHANNEL_FD) 告诉子进程
 * 这个IPC通道的文件描述符.
 * 
 * 子进程在启动的过程中, 根据文件描述符去连接这个已存在的IPC通道, 从而完成父子进程之间的连接. 为创建IPC管道的步骤示意图
 * 
 *   |  父进程  | ------- 生成  -------->  |  子进程  |
 *        \                                   /
 *         \                                 /
 *      监听/接受                           连接
 *           \                             /
 *            V                           V
 *               |         IPC          |  
 * 
 * 建立连接之后的父子进程就可以自由地通信了. 由于IPC通道是用命名管道 或 Domain Socket 创建的, 它们与网络socket的行为比较类似,
 * 属于双向通信.  不同的是它们在系统内核中就完成了进程间的通信, 而不用经过实际的网络层, 非常高效.  在 Node 中, IPC通道被抽象为
 * Stream对象, 在调用 send() 时发送数据(类似于 write()), 接收到消息会通过 message 事件(类似于 data) 触发给应用层.
 * 
 * 注意, 只有启动的子进程是Node进程时,子进程才会根据环境变量去连接IPC通道, 对于其他类型的子进程则无法实现进程间通信, 除非其他进程
 * 也按约定去连接这个已经创建好的IPC通道.
 */

/**
 * 3. 句柄传递
 * 建立好进程之间的IPC后, 如果仅仅只用来发送一些简单的数据, 显然不够我们的实际应用使用. 还记得本章第一部分代码需要将启动的服务器分别
 * 监听各自的端口? 如果让服务器监听到相同的端口, 将会有什么样的结果? 实例如下
 * var http = require('http');
 * http.createServer(function(req,res){
 *   res.writeHead(200, {'Content-Type':'text/plain'});
 *   res.end('Hello World\n');
 * }).listen(8888,'127.0.0.1');
 * 
 * 这时只有一个工作进程能够监听到该端口上, 其余的进程在监听的过程中都抛出了 EADDRINUSE 异常, 这时端口被占用的情况, 新的进程不能继续
 * 监听该端口了. 这个问题破坏了我们将多个进程监听同一个端口的想法. 这个问题破坏了我们将多个进程监听同一个端口的想法. 要解决这个问题,
 * 通常的做法是让每个进程监听不同的端口, 其中主进程监听主端口(如80),主进程对外接收所有的网络请求,再将这些请求分别代理到不同的端口的进程
 * 上.
 * 
 *                                  |  用户  |
 *                                      |
 *                                      |
 *                                      Y
 *                                  | Node  |
 *                                  |  (80) |
 *                                  |-------|
 * 
 *                            /       |          |         \
 *                      | Node  | | Node  | | Node  | |  Node  |
 *                      |(8001) | |(8002) | |(8003) | | (.....)|
 *                      |-------| |-------| |-------| |--------|
 * 主进程接收, 分配网络请求的示意图
 * 
 * 通过代理, 可以避免端口不能重复监听的问题, 甚至可以在代理进程上做适当的负载均衡, 使得每个子进程可以较为均衡地执行任务. 由于进程
 * 每接收到一个连接, 将会用掉一个文件描述符, 因此代理方案中客户端连接到代理进程, 代理进程连接到工作进程需要用掉两个文件描述符. 操作系统
 * 的文件描述符是有限的,代理方案浪费掉一倍数量的文件描述符的做法影响了系统的扩展能力.
 * 
 * 为了解决上述这样的问题, Node的版本v0.5.9 引入了进程间发送句柄的功能. send() 方法除了能通过IPC发送数据外, 还能发送句柄,第二个可选参数就是句柄,如下
 * child.send(message, [sendHandle])
 * 
 * 那什么是句柄? 句柄是一种可以用来标识资源的引用, 它的内部包含了指向对象的文件描述符. 比如句柄可以用来标识一个服务器端socket对象,一个客户端socket
 * 对象, 一个UDP套接字, 一个管道等.
 * 
 * 发送句柄意味着什么? 在前一个问题中, 我们可以去掉代理这种方案, 使主进程接收到socket请求后, 将这个socket直接发送给工作进程,而不是重新与工作
 * 进程之间建立新的socket连接来转发数据. 文件描述符浪费的问题可以通过这样的方式轻松解决.
 * 
 * 主进程代码如下
 * var child = require('child_process').fork('child.js');
 * 
 * //Open up the server object and send the handle
 * var server = require('net').createServer();
 * server.on('connection',function(socket){
 *     socket.end('handled by parent\n');
 * });
 * server.listen(1337,function(){
 *     child.send('server',server);
 * });
 * 
 * 子进程代码如下
 * process.on('message',function(m,server){
 *    if(m === 'server'){
 *       server.on('connection',function(socket){
 *         socket.on('handled by child\n');
 *       });
 *    }
 * });
 * 
 * 这个示例中直接将一个TCP服务器发送给了子进程. 这是看起来不可思议的事情.先来测试一番,看看效果如何.
 * 然后新开一个命令行窗口,用上curl工具,如下
 * > curl "http://127.0.0.1:1337/"
 * handled by parent
 * > curl "http://127.0.0.1:1337/"
 * handled by child
 * > curl "http://127.0.0.1:1337/"
 * handled by child
 * > curl "http://127.0.0.1:1337/"
 * handled by parent
 * 
 * 命令行的响应结果也是很不可思议的, 这里子进程和父进程都有可能处理我们客户端发起的请求.
 * 试试将服务发送给多个子进程,如下
 * // parent.js
 * var cp = require('child_process');
 * var child1 = cp.fork('child.js');
 * var child2 = cp.fork('child.js');
 * 
 * //Open up the server object and send the handle
 * var server = require('net').createServer();
 * server.on('connection',function(socket){
 *      socket.end('handled by parent\n');
 * });
 * server.listen(1337,function(){
 *     child1.send('server',server);
 *     child2.send('server',server);
 * });
 * 
 * 然后在子进程中将进程ID打印出来,如下: 
 * // child.js
 * process.on('message',function(m,server){
 *     if(m === 'server') {
 *          server.on('connection',function(socket){
 *             socket.on('handled by child\n');
 *          });
 *     }
 * });
 * 
 * 再用curl测试我们的服务,如下
 * > curl "http://127.0.0.1:1337/"
 * handled by child, pid is 24673
 * > curl "http://127.0.0.1:1337/"
 * handled by parent
 * > curl "http://127.0.0.1:1337/"
 * handled by child, pid is 24672
 * 
 * 测试的结果是每次出现的结果都可能不同, 结果可能被父进程处理, 也可能被不同的子进程处理. 并且这是在TCP层面上完成的事情,
 * 我们尝试将其转化到HTTP层面来试试. 对于主进程而言, 我们甚至想要它更轻量一点,那么是否将服务器句柄发送给子进程之后,
 * 就可以关掉服务器的监听, 让子进程来处理请求呢?
 * 
 * 我们对主进程进程改动,如下
 * 
 * // parent.js
 * var cp = require('child_process');
 * var child1 = cp.fork('child.js');
 * var child2 = cp.fork('child.js');
 * 
 * //Open up the server object and send the handle
 * var server = require('net').createServer();
 * server.listen(1337, function(){
 *    child1.send('server',server);
 *    child2.send('server',server);
 *    // 关掉
 *    server.close();
 * });
 * 
 * 然后对子进程进行改动, 如下
 * //child.js
 * var http = require('http');
 * var server = http.createServer(function(req,res){
 *    res.writeHead(200, {'Content-Type':'text/plain'});
 *    res.end('handled by child, pid is ' + process.pid + '\n');
 * });
 * 
 * process.on('message',function(m,tcp){
 *    if(m === 'server'){
 *       tcp.on('connection',function(socket){
 *          server.emit('connection',socket);
 *       });
 *    }
 * });
 * 
 * 重新启动 parent.js后, 再次测试,如下
 * > curl "http://127.0.0.1:1337/"
 * handled by child, pid is 24852
 * > curl "http://127.0.0.1:1337/"
 * handled by child, pid is 24851
 * 
 * 这样一来,所有的请求都是由子进程处理了,整个过程中,服务的过程发生了一次改变. 如下
 * 
 *                                 | 用户 |
 *                                    |
 *                                    |
 *                                    V
 * | Node | --------- 监听 -------> | port |
 *     | \    \       \
 *     |  \    \      \
 *     |   \    \      \
 *     |    \    \      \
 *    发送  发送  发送    发送
 *     |      \    \      \
 *     V      V    V      V
 * | Node | |Node||Node||Node|
 * 
 * 主进程将请求发送给工作进程
 * 
 * 主进程发送完句柄并关闭监听之后, 成为了如下结构
 * 
 *                                  | 用户 |
 *                                      |
 *                                      |
 *                                      V
 * | Node |------------X------------>| port |
 * 
 *                               /    /   \    \
 *                               /   /     \    \
 *                            监听  监听   监听   监听
 *                             /   /        \     \
 *                        | Node | Node | Node | Node |
 */   
