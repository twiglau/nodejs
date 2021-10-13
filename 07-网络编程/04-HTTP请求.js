/**
 * 对于TCP连接的读操作, http 模块将其封装为 ServerRequest 对象. 再次
 * 查看前面的请求报文,报文头部将会通过 http_parser 进行解析.如下: 
 * 
 * > GET / HTTP/1.1
 * > User-Agent: curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8r zlib/1.2.5
 * > Host: 127.0.0.1:1337
 * > Accept: *
 * 
 * 报文头第一行 GET / HTTP/1.1 被解析之后分解为如下属性.
 * - req.method 属性: 值为GET, 是为请求方法,常见的请求方法有GET, POST, DELETE, PUT, CONNECT 等几种.
 * - req.url属性: 值为 /.
 * - req.httpVersion属性: 值为1.1
 * 
 * 其余报头是很规律的 Key: Value 格式, 被解析后放置在 req.headers 属性上传传递给业务逻辑以供调用,如下: 
 * headers: {
 *   'user-agent': 'curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8r zlib/1.2.5',
 *   'host': '127.0.0.1:1337',
 *   'accept': '*'
 * }
 * 
 * 报文体部分则抽象为一个只读流对象, 如果业务逻辑需要读取报文本中的数据, 则要在这个数据流结束后才能进行操作,如下: 
 * function(req,res) {
 *   // console.log(req.headers);
 *   var buffers = [];
 *   req.on('data',function(trunk){
 *       buffers.push(trunk);
 *   }).on('end',function(){
 *       var buffer = Buffer.concat(buffers);
 *       // TODO
 *       res.end('Hello world')
 *   });
 * }
 * 
 * HTTP请求对象和HTTP响应对象是相对较底层的封装, 现行的Web框架如 Connect 和 Express 都是在这两个对象的基础上进行
 * 高层封装完成的. 
 */