/**
 * 响应客户端的部分.
 * 响应的可能是一个HTML网页,也可能是 CSS, JS文件, 或者是 其他多媒体文件.
 * 对于过去流行的 ASP, PHP, JSP 等动态网页技术, 页面渲染是一种内置的功能,
 * 但对于Node来说, 它并没有这样的内置功能.
 */

/**
 * 1. 内容响应
 * 在这里我们则展开说明应用层如何使用响应的封装. 服务器端响应的报文, 最终都要被终端
 * 处理. 这个终端可能是命令行终端, 也可能是代码终端, 也可能是浏览器.
 * 
 * > 服务器端的响应从一定程度上决定或指示了客户端该如何处理响应的内容.
 * 
 * 内容响应的过程中, 响应报头中的 Content-* 字段十分重要. 在下面的示例响应报文中,服务端
 * 告知客户端内容是以 gzip 编码的, 其内容长度为 21 170 字节, 内容类型为 JavaScript,
 * 字符集为 UTF-8: 
 * Content-Encoding: gzip
 * Content-Length: 21170
 * Content-Type: text/javascript; charset=utf-8
 * 
 * 客户端在接收到这个报文后, 正确的处理过程是通过 gzip 来解码报文体中的内容,用长度校验
 * 报文体内容是否正确, 然后再以字符集UTF-8将解码后的脚本插入到文档节点中.
 * 
 * 1.1 MIME
 * 如果想要客户端用正确的方式来处理响应内容,了解MIME必不可少. 可以先猜想一下下面两段代码在客户端
 * 会有什么样的差异
 * 
 * res.writeHead(200, {'Content-Type': 'text/plain' });
 * res.end('<html><body>Hello World</body></html>\n');
 * 
 * //或者
 * res.writeHead(200, {'Content-Type':'text/html'});
 * res.end('<html><body>Hello World</body></html>\n');
 * 
 * 在网页中, 前者显示的是<html><body>Hello World</body></html>, 而后者只能看到 Hello World 网页.
 * 
 * Content-Type 字段值不同 使网页显示的内容不同
 * 
 * 没错, 引起上述差异的原因就在于它们的 Content-Type 字段的值是不同的. 浏览器对内容采用了不同的处理方式,
 * 前者为纯文本, 后者为HTML,并渲染了DOM树. 浏览器正是通过不同的 Content-Type 的值来决定采用不同的渲染
 * 方式,这个值我们简称为 MIME 值.
 * 
 * MIME的全称是 Multipurpose Internet Mail Extensions, 从名字可以看出,它最早用于电子邮件,后来也应
 * 用到浏览器中. 不同的文件类型具有不同的 MIME 值, 如JSON文件的值为 application/json, XML文件的值为
 * application/xml, PDF文件的值为 application/pdf.
 * 
 * 为了方便获知文件的MIME值, 社区有专有的 mime 模块可以用判断文件类型. 它的调用十分简单,如下
 * var mime = require('mime');
 * 
 * mime.lookup('/path/to/file.txt');   // => 'text/plain'
 * mime.lookup('file.txt');            // => 'text/plain'
 * mime.lookup('.TXT');                // => 'text/plain'
 * mime.lookup('htm');                 // => 'text/html'
 * 除了MIME值外, Content-Type的值中还可以包含一些参数,如字符集,示例如下
 * Content-Type: text/javascript; charset=utf-8
 * 
 * 
 * 1.2 附件下载
 * 在一些场景下, 无论响应的内容是什么样的MIME值, 需求中并不要求客户端去打开它, 只需弹出并下载它即可. 为了满足
 * 这种需求, Content-Disposition 字段应声登场. Content-Disposition字段影响的行为是客户端会根据它的值判断
 * 是应该将报文数据当做即使浏览的内容, 还是可下载的附件. 当内容只需即时查看时,它的值为inline, 当数据可以存为附件
 * 时, 它的值为 attachment. 另外, Content-Disposition 字段还能通过参数指定保存时应该使用的文件名,如下
 * Content-Disposition: attachment; filename="filename.ext"
 * 
 * 如果我们要设计一个响应附件下载的API(res.sendfile), 我们的方法大致是如下: 
 */
res.sendfile = function(filepath){
    fs.stat(filepath, function(err,stat){
        var stream = fs.createReadStream(filepath);
        //设置内容
        res.setHeader('Content-Type',mime.lookup(filepath));
        //设置长度
        res.setHeader('Content-Length',stat.size);
        //设置为附件
        res.setHeader('Content-Disposition','attachment; filename="' + path.basename(filepath) + '"');
        res.writeHead(200);
        stream.pipe(res);
    })
}
/**
 * 1.3 响应JSON
 * 为了快捷地响应JSON数据,我们也可以如下这样封装: 
 */
res.json = function(json){
    res.setHeader('Content-Type','application/json');
    res.writeHead(200);
    res.end(JSON.stringify(json));
}

/**
 * 1.4 响应跳转
 * 当我们的URL因为某些问题(譬如权限限制) 不能处理当前请求, 需要将用户跳转到别的URL时, 我们也可以封装一个
 * 快捷的方法实现跳转,如下
 */
res.redirect = function(url){
    res.setHeader('Location',url);
    res.writeHead(302);
    res.end('Redirect to ' + url);
};

/**
 * 2. 视图渲染
 * Web应用的内容响应形式十分丰富, 可以是静态文件内容, 也可以是其他附件文件,也可以是跳转等. 这里我们回到主流的普通
 * 的HTML内容的响应上, 总称视图渲染. Web应用最终呈现在界面上的内容,都是通过一系列的视图渲染呈现出来的. 在动态页面
 * 技术中,最终的视图是由模板和数据共同生成出来的.
 * 
 * 模板是带有特殊标签的HTML片段,通过与数据的渲染,将数据填充到这些特殊标签中,最后生成普通的带数据的HTML片段. 通常
 * 我们将渲染方法设计为 render(), 参数就是模板路径的数据,如下
 */
res.render = function(view,data){
    res.setHeader('Content-Type','text/html');
    res.writeHead(200);
    //实际渲染
    var html = render(view,data);
    res.end(html);
};
/**
 * 在Node中, 数据自然是以JSON为首选, 但是模板却又太多选择可以使用了. 上面代码中的 render() 我们可以将其看成是一个约定
 * 接口,接受相同参数,最后返回HTML片段.
 */