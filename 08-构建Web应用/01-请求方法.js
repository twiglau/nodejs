/**
 * 在Web应用中, 最常见的请求方法是 GET 和 POST, 除此之外, 还有 HEAD,DELETE,PUT,CONNECT 等方法,请求方法存在于报文
 * 的第一行的第一个单词, 通常是大写. 如下示例: 
 * > GET /path?foo=bar HTTP/1.1
 * > User-Agent: curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8r zlib/1.2.5
 * > Host: 127.0.0.1:1337
 * 
 * HTTP_Parser 在解析请求报文的时候, 将报文头抽取出来,设置为 req.method. 通常, 我们只需要处理 GET 和 POST 两类请求
 * 方法, 但是在 RESTful 类web服务中请求方法十分重要,因为它会决定资源的操作行为. PUT 代表新建一个资源, POST 表示要更新
 * 一个资源, GET表示查看一个资源,而 DELETE 表示删除一个资源.
 * 
 * 我们可以通过请求方法来决定响应行为,如下: 
 * function (req,res) {
 *      switch(req.method){
 *         case 'POST': 
 *           update(req,res);
 *           break;
 *         case 'DELETE': 
 *           remove(req,res);
 *           break;
 *         case 'PUT':
 *           create(req,res);
 *           break;
 *         case 'GET': 
 *         default: 
 *           get(req,res);
 *     }
 * }
 * 
 * 上述代码代表了一种根据请求方法将复杂的业务逻辑分发的思路, 是一种化繁为简的方式.
 */