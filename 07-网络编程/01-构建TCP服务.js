/**
 * Node 提供了 net, dgram, http, https 这4个模块, 分别用于处理 TCP, UDP, HTTP, HTTPS, 适用于
 * 服务器端和客户端
 */

// TCP
/**
 * TCP 全名为传输控制协议,在OSI模型(由7层组成,分别为物理层,
 * 数据链路层, 网络层, 传输层, 会话层, 表示层, 应用层 ) 中属于传输层协议.
 * 许多应用层协议基于TCP构建, 典型的是 HTTP, SMTP, IMAP 等协议.如下
 * 
 * HTTP,SMTP,IMAP等  |  应用层
 * 加密/解密等        |   表示层
 * 通信链接/维持会话   |   会话层
 * TCP/UDP           |  传输层
 * IP               |    网络层
 * 网络特有的链路接口   |   链路层
 * 网络物理硬件        |   物理层
 * 
 * OSI 模型   ( 七层协议)
 */

var net = require('net');
var server = net.createServer(function (socket){
    //新的连接
    socket.on('data',function(data){
        socket.write("你好");
    });
    socket.on('end',function(){
        console.log('连接断开');
    });
    socket.write("欢迎光临<深入浅出> 示例: \n");
});
server.listen(8124,function(){
    console.log('server bound');
});

/**
 * 1. 可以利用 Telnet 工具作为客户端对刚才创建的简单服务器进行会话交流,如下: 
 * > telnet 127.0.0.1 8124
 */

/**
 * 2. 除了端口外, 同样我们也可以对Domain Socket 进行监听, 代码如下: 
 * server.listen('/tmp/echo.sock')
 * 
 * 通过nc工具进行会话, 测试上面构建的TCP服务的代码如下: 
 * > nc -U /tmp/echo.sock
 * 
 * 通过 net 模块自行构造客户端进行会话, 测试上面构建的TCP服务的如 client.js
 */

/**
 * 3. 其结果与使用 Telnet 和 nc 的会话结果并无差别. 如果是 Domain Socket, 在
 * 填写选项时, 填写 path 即可, 如下: 
 * var client = net.connect({path: '/tmp/echo.sock'});
 */

/**
 * 4. TCP 服务的事件
 * 1 > 服务器事件
 * 对于通过 net.createServer() 创建的服务器而言, 它是一个 EventEmitter 实例, 自定义
 * 事件有如下几种.
 * listening: 在调用server.listen() 绑定端口 或者 Domain Socket 后触发
 * server.listen(port,listeningListener), 同过 listen() 方法的第二个参数传入. 
 * 
 * connection: 每个客户端套接字连接到服务器端时触发. 
 * net.createServer(), 最后一个参数传递. 
 * 
 * close: 当服务器关闭时触发, 在调用 server.close() 后, 服务器将停止接收新的套接字连接,但
 * 保持当前存在的连接, 等待所有连接断开后, 会触发该事件 
 * 
 * error: 当服务器发生异常是,将会触发该事件. 比如侦听一个使用中的端口, 将会触发一个异常, 如果不
 * 侦听 error 事件, 服务器将会抛出异常
 * 
 * 2> 连接事件
 * 服务器可以同时与多个客户端保持连接,对于每个连接而言是典型的可写可读 Stream 对象.
 * 
 * Stream 对象可以用于服务器端和客户端之间的通信, 即可以通过data事件从一端读取另一端发来的数据, 也可以
 * 通过write()方法从一端向另一端发送数据. 如下
 * 
 * data: 当一端调用 write() 发送数据时, 另一端会触发data事件, 事件传递的数据即是 write() 发送的数据
 * end: 当连接中的任意一端发送了 FIN 数据时, 将会触发该事件.
 * connect: 该事件用于客户端, 当套接字与服务器端连接成功时会被触发. 
 * drain: 当任意一端调用 write() 发送数据时, 当前这端会触发该事件
 * error: 当异常发生时, 触发该事件. 
 * close: 当套接字完全关闭时, 触发该事件. 
 * timeout: 当一定时间后连接不再活跃时, 该事件将会被触发, 通知用户当前该连接已经被闲置
 * 
 * 另外, 由于TCP套接字是可写可读的Stream对象, 可以利用 pipe() 方法巧妙地实现管道操作
 */

var net1 = require('net');
var server1 = net1.createServer(function (socket){
    socket.write('Echo server\r\n');
    socket.pipe(socket);
});
server1.listen(1337,'127.0.0.1');
