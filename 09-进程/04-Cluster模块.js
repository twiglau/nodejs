/**
 * Cluster 模块
 * 前文介绍了 child_process 模块中的大多数细节, 以及如何通过这个模块构建强大的单机集群. 如果熟知Node,
 * 也许你会惊讶为何迟迟不谈cluster模块. 上述提及的问题, Node 在v0.8 版本时新增的 cluster 模块就能解决.
 * 在 v0.8 版本之前, 实现多进程架构必须通过 child_process 来实现, 要创建单机 Node 集群, 由于有这么多
 * 细节需要处理,对普通工程师而言是一件相对较难的工作, 于是v0.8 直接引入 cluster 模块, 用以解决多核CPU的利用
 * 率问题,同时也提供了较为完善的API, 用以处理进程的健壮性的问题.
 * 
 * 对于本章开头提到的创建Node进程集群, cluster 实现起来也是很轻松的事情,如下
 * // cluster.js
 * 
 * 执行node cluster.js 将会得到与前文创建子进程集群的效果相同. 就官方的文档而言, 它更喜欢如下的形式作为示例: 
 * var cluster = require('cluster');
 * var http = require('http');
 * var numCPUs = require('os').cpus().length;
 * if(cluster.isMaster){
 *    // Fork workers
 * }
 * 
 * 在进程中判断是主进程还是工作进程, 主要取决于环境变量中是否有 NODE_UNIQUE_ID, 如下
 * cluster.isWorker = ('NODE_UNIQUE_ID' in process.env);
 * cluster.isMaster = (cluster.isWorker === false);
 * 
 * 但是官方示例中忽而判断 cluster.isMaster, 忽而判断 cluster.isWorker, 对于代码的可读性十分差. 建议用
 * cluster.setupMaster() 这个API, 将主进程和工作进程从代码上完全剥离, 如同send() 方法看起来直接将服务器
 * 从主进程发送到子进程那样神奇, 剥离代码之后, 甚至都感觉不到主进程中有任何服务器相关的代码.
 * 
 * 通过 cluster.setupMaster() 创建子进程而不是使用 cluster.fork(), 程序结构不再凌乱,逻辑分明,代码的可读性
 * 和可维护性较好.
 */

/**
 * 1. Cluster 工作原理
 * 事实上 cluster 模块就是 child_process 和 net 模块的组合应用. cluster 启动时, 如同我们在 9.2.3 字节里的代码
 * 一样,它会在内部启动 TCP 服务器, 在 cluster.fork() 子进程时, 将这个TCP服务器端 socket 的文件描述符发送给工作
 * 进程. 如果进程是通过 cluster.fork() 复制出来的, 那么它的环境变量里就存在 NODE_UNIQUE_ID, 如果工作进程中存在
 * listen() 侦听网络端口的调用, 它将拿到该文件描述符, 通过 SO_REUSEADDR 端口重用, 从而实现多个子进程共享端口. 对
 * 与普通方式启动的进程, 则不存在文件描述符传递共享等事情.
 * 
 * 在cluster内部隐式创建TCP服务器的方式对使用者来说十分透明, 但也正是这种方式使得它无法如直接使用 child_process 那样
 * 灵活. 在 cluster 模块应用中, 一个主进程只能管理一组工作进程,如下
 * 
 *                                 |  主进程  |
 *                                      |
 *          -------------------------------------------------------------
 *          |                |                    |                     |
 *     | 工作进程 |      | 工作进程  |          | 工作进程  |         |  工作进程  |
 * 
 * 在cluster模块应用中, 一个主进程只能管理一组工作进程
 * 
 * 对于自行通过child_process来操作时, 则可以更灵活地控制工作进程, 甚至控制多组工作进程. 其原因在于自行通过 child_process
 * 操作子进程时, 可以隐式地创建多个TCP服务器, 使得子进程可以共享多个的服务器端 socket, 如下
 *          
 *                                 |  主进程  |
 *                                      |
 *          --------------------------------------------------------------
 *          |                  |                    |                    |
 *    | 工作进程 |          | 工作进程  |         | 工作进程  |         | 工作进程  |
 *    | app.js  |          | app.js  |         |  app.js  |         | app.js   |
 * 
 * 自行通过 child_process 控制多组工作进程
 * 
 */


/**
 * 2. Cluster 事件
 * 对于健壮性处理, cluster 模块也暴露了相当多的事件.
 * > fork: 复制一个工作进程后触发该事件.
 * 
 * > online: 复制好一个工作进程后, 工作进程主动发送一条 online 消息给主进程, 主进程收到消息后, 触发该事件.
 * 
 * > listening: 工作进程中调用 listen() (共享了服务器端 Socket )后, 发送一条 listening 消息给主进程, 主进程收到消息后, 触发该事件.
 * 
 * > disconnect: 主进程和工作进程之间IPC通道断开后会触发该事件.
 * 
 * > exit: 有工作进程退出时触发该事件.
 * 
 * > setup: cluster.setupMaster() 执行后触发该事件.
 * 
 * 这些事件大多跟 child_process 模块的事件相关, 在进程间消息传递的基础上完成的封装. 这些事件对于增强应用的健壮性已经足够了.
 */