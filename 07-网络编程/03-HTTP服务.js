/**
 * TCP 与 UDP 都属于网络传输层协议, 如果要构造高效的网络应用, 就应该从传输层进行着手. 但是对于经典
 * 的应用场景, 则无须从传输层协议入手构造自己的应用, 比如 HTTP 或 SMTP 等, 这些经典的应用层协议对于
 * 普通应用而言绰绰有余. 
 */

/**
 * 1. HTTP
 * HTTP构建在TCP之上, 属于应用层协议.
 */

/**
 * 2. HTTP报文
 * 这里采用的工具是 curl, 通过 -v 选项,可以显示这次网络通信的所有报文信息
 * 
 * /

/**
 * 2.1 以下我们可以看到这次网络通信的报文信息分为几个部分.
 */
/*
* Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to 127.0.0.1 (127.0.0.1) port 1337 (#0)
-----> 以上为经典的TCP 的 3次握手过程

> GET / HTTP/1.1
> Host: 127.0.0.1:1337
> User-Agent: curl/7.64.1
> Accept:
-----> 第二部分是在完成握手之后, 客户端向服务器端发送请求报文

// > 
// < HTTP/1.1 200 OK
// < Content-Type: text/plain
// < Date: Tue, 12 Oct 2021 02:25:21 GMT
// < Connection: keep-alive
// < Transfer-Encoding: chunked
// < 
// Hello World
-----> 第三部分是服务器端完成处理后, 向客户端发送响应内容,包括响应头和响应体.


// * Connection #0 to host 127.0.0.1 left intact
// * Closing connection 0
-----> 最后部分是结束会话的信息,如上

从上述的报文信息中可以看出 HTTP 的特点, 它是基于请求响应式的, 以一问一答的方式实现服务, 虽然基于
TCP 会话, 但是本身却并无会话的特点

从协议的角度来说, 现在的应用, 如浏览器, 其实是一个 HTTP 的代理, 用户的行为将会通过他转化为 HTTP
请求报文发送给服务器端, 服务器端在处理请求后, 发送响应报文给代理, 代理在解析报文后, 将用户需要的
内容呈现在界面上.

以浏览器打开一张图片地址为例: 
首先, 浏览器构造HTTP报文发向图片服务器端; 然后, 服务器判断报文中的要请求的地址, 将磁盘中的图片文件
以报文的形式发送给浏览器; 浏览器接收完图片后, 调用渲染引擎将其显示给用户. 简而言之, HTTP服务只做两
件事情; 处理HTTP请求 和 发送HTTP响应. 

无论是HTTP请求报文还是 HTTP 响应报文, 报文内容都包含两个部分: 报文头和报问体.
上文的报文代码中 > 和 < 部分属于报文的头部, 由于是 GET 请求, 请求报文中没有包含报问体, 响应报文中的
Hello World 即是报文体
 */


/**
 * 3. http 模块
 * Node 的 http 模块包含对 HTTP 处理的封装. 在Node中, HTTP服务继承自TCP服务器 (net 模块), 它能够
 * 与多个客户端保持连接, 由于其采用事件驱动的形式, 并不为每一个连接创建额外的线程或进程,保持很低的内存占用,
 * 所以能实现高并发. HTTP服务与TCP服务模型有区别的地方在于, 在开启keepalive后, 一个TCP会话可以用于多次
 * 请求和响应. TCP服务以 connection 为单位进行服务, HTTP服务以 request 为单位进行服务. http 模块即是
 * 将 connection 到 request 的过程进行了封装
 * 
 *                       connection
 * ------------------------------------------------------------------
 *               request          |         |--------|  |--------|
 * -------------------------------|         | request|  | request|
 *    request    |     request    |         |        |  |        |
 * ------------------------------------------------------------------
 *       http 模块将 connection 到  request 的过程进行了封装
 * 除此之外, http 模块将连接所用套接字的读写抽象为 ServerRequest 和 ServerResponse 对象, 它们分别对应
 * 请求和响应操作. 在请求产生的过程中, http 模块拿到连接中传来的数据, 调用二进制模块 http_parser 进行解析,
 * 在解析完请求报文的报头后, 触发request事件, 调用用户的业务逻辑.
 * 
 *                  |    TCP  服务器套接字 |
 *         |------------------\---------------------
 *         |        |---------Y----------|         |
 * http模块 |        |      HTTP 请求     |          |
 *         |        |--------------------|         |
 *         |           /           \               |
 *         |   |-----------|  |-----------|        |
 *         |   |  请求      |  |  响应     |        |
 *         |   |-----------|  |-----------|         |
 *         |---------\------------/-----------------|
 *                   \           /              
 *             |-----Y----------Y---------|
 *             |      处理程序             |
 *             |--------------------------|
 *  http 模块产生请求的过程
 *  处理程序对应示例中的代码就是响应 Hello World 这部分, 代码如下:
 *  function (req,res) {
 *    res.writeHead(200,{'Content-Type':'text/plain'});
 *    res.end('Hello World\n');
 *  }
 */


