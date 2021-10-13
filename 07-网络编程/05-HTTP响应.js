/**
 * 它封装了对底层连接的写操作, 可以将其看成一个可写的流对象. 它影响响应报文头部信息
 * 的API 为 res.setHeader() 和 res.writeHead(). 示例: 
 * res.writeHead(200, {'Content-Type':'text/plain' });
 * 
 * 其分为 setHeader() 和 writeHead() 两个步骤. 它在http模块的封装下,生成如下报文: 
 * < HTTP/1.1 200 OK
 * < Content-Type: text/plain
 * 
 * 可以调用 setHeader 进行多次设置, 但只有调用 writeHead 后, 报头才会写入到连接中. 
 * 除此之外, http 模块会自动帮你设置一些头信息,如下: 
 * < Date: Sat, 06 Apr 2013 08:01:44 GMT
 * < Connection: keep-alive
 * < Transfer-Encoding: chunked
 * < 
 * 
 * 报文体部分则是调用 res.write() 和 res.end() 方法实现, 后者与前者的差别在于res.end()
 * 会先调用 write() 发送数据, 然后发送信号告知服务器这次响应结束,如下: 
 * Hello World
 * 
 * 响应结束后, HTTP服务器可能会将当前的连接用于下一个请求, 或者关闭连接. 值得注意的是, 报头是在报文体发送前发送的,
 * 一旦开始了数据的发送, writeHead() 和 setHeader() 将不再生效.
 * 
 * 另外, 无论服务器在处理业务逻辑时是否发生异常, 务必在结束时调用 res.end() 结束请求, 否则客户端将一直处于
 * 等待的状态. 当然, 也可以通过延迟 res.end() 的方式实现客户端与服务器端之间的长连接, 但结束时务必关闭连接.
 */