/**
 * 除了根据请求方法来进行分发外, 最常见的请求判断莫过于路径的判断了. 路径部分存在于报文的第一行的第二部分,
 * 如下:
 * GET /path?foo=bar HTTP/1.1
 * 
 * HTTP_Parser 将其解析为 req.url. 一般而言, 完整的 URL 地址是如下: 
 * > http://user:pass@host.com:8080/p/a/t/h?query=string#hash
 * 
 * 客户端代理(浏览器) 会将这个地址解析成报文, 将路径和查询部分放在报文第一行. 需要注意的是, hash部分会被丢弃,
 * 不会存在于报文的任何地方
 * 
 * 最常见的根据路径进行业务处理的应用是静态文件服务器, 它会根据路径去查找磁盘中的文件, 然后将其响应给客户端,如下: 
 * 
 */
function(req,res){
    var pathname = url.parse(req.url).pathname;
    fs.readFile(path.join(ROOT,pathname),function(err,file){
        if(err){
            res.writeHead(404);
            res.end('找不到相关文件. --');
            return;
        }
        res.writeHead(200);
        res.end(file);
    });
}
/**
 * 还有一种比较常见的分发场景是根据路径来选择控制器, 它预设路径为控制器和行为的组合,无须额外配置路由信息,如下: 
 * /controller/action/a/b/c
 * 
 * 这里的 controller 会对应到一个控制器, action 对应控制器的行为,剩余的值会作为参数进行一些别的判断.
 */

function (req,res){
    var pathname = url.parse(req.url).pathname;
    var paths = pathname.split('/');
    var controller = paths[1] || 'index';
    var action = paths[2] || 'index';
    var args = paths.alice(3);
    if(handles[controller] && handles[controller][action]){
        handles[controller][action].apply(null,[req,res].concat(args));
    }else {
        res.writeHead(500);
        res.end('找不到响应控制器');
    }
}
//这样我们的业务部分可以只关心具体的业务实现,如下
handles.index = {};
handles.index.index = function(req,res,foo,bar){
    res.writeHead(200);
    res.end(foo);
};