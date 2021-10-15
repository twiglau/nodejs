/**
 * Node 的http模块只对HTTP报文的头部进行了解析,然后触发 request 事件. 如果请求中还带有内容部分
 * (如POST请求,它具有报头和内容), 内容部分需要用户自行接收和解析. 通过报头的 Transfer-Encoding
 * 或 Content-Length 即可判断请求中是否带有内容,如下
 * var hasBody = function(req){
 *    return 'transfer-encoding' in req.headers || 'content-length' in req.headers;
 * }
 * 
 * 在HTTP_Parser解析报头结束后, 报文内容部分会通过 data 事件触发, 我们只需以流的方式处理即可,如下
 * function(req,res){
 *   if(hasBody(req)){
 *      var buffers = [];
 *      req.on('data',function(chunk){
 *          buffers.push(chunk);
 *      });
 *      req.on('end',function(){
 *          req.rawBody = Buffer.concat(buffers).toString();
 *          handle(req,res);
 *      });
 *   } else {
 *      handle(req,res);
 *   }
 * }
 * 将接收到的Buffer列表转化为一个Buffer对象后,再转换为没有乱码的字符串,暂时挂置在req.rawBody处
 */

/**
 * 2. 表单数据
 * 最为常见的数据提交就是通过网页表单提交数据到服务器端,如下
 * <form action="/upload" method="post">
 *    <label for="username">Username:</label> <input type="text" name="username" id="username" />
 *    <br />
 *    <input type="submit" name="submit" value="Submit" />
 * </form>
 * 
 * 默认的表单提交, 请求头中的 Content-Type 字段值为 application/x-www-form-urlencoded, 如下
 * Content-Type: application/x-www-form-urlencoded
 * 
 * 由于它的报文内容跟查询字符串相同: 
 * foo=bar&baz=val
 * 
 * 因此解析它十分容易: 
 * var handle = function(req,res){
 *   if(req.headers['content-type'] === 'application/x-www-form-urlencoded') {
 *        req.body = querystring.parse(req.rawBody);
 *   }
 *   todo(req,res);
 * };
 * 后续业务中直接访问 req.body 就可以得到表单中提交的数据
 */


/**
 * 3. 其他格式
 * 除了表单数据外, 常见的提交还有JSON和XML文件等,判断和解析它们的原理都比较相似,都是依据Content-Type中的值决定,
 * 其中JSON类型的值为application/json, XML的值为 application/xml
 * 
 * 需要注意的是, 在Content-Type中可能还附带如下编码
 * Content-Type: application/json; charset=utf-8
 * 
 * 所以在做判断时, 需要注意区分,如下
 * var mime = function(req){
 *   var str = req.headers['content-type'] || '';
 *   return str.split(';')[0];
 * }
 * 
 * 3.1 JSON文件
 * 如果从客户端提交JSON内容, 这对于Node来说, 要处理它都不需要额外的任何库,如下
 */
var handle = function(req,res){
    if(mime(req) === 'application/json'){
        try {
            req.body = JSON.parse(req.rawBody);
        } catch (e) {
            // 异常内容,响应Bad request
            res.writeHead(400);
            res.end('Invalid JSON');
            return;
        }
    }
    todo(req,res);
};
/**
 * 3.2 XML文件
 * 解析XML文件稍微复杂一点, 但是社区有支持 XML 文件到 JSON对象转换的库, 这里以 xml12js模块为例
 */
var xml12js = require('xml12js');
var handle = function(req,res){
    if(mime(req) === 'application/xml'){
        xml12js.parseString(req.rawBody,function(err,xml){
            if(err){
                // 异常内容, 响应 Bad request
                res.writeHead(400);
                res.end('Invalid XML');
                return;
            }
            req.body = xml;
            todo(req,res);
        });
    }
};
/**
 * 采用类似的方式, 无论客户端提交的数据是什么格式,我们都可以通过这种方式来判断该数据是何种类型,
 * 然后采用对应的解析方法解析即可
 */

/**
 * 3.3 附件上传
 * 除了常见的表单和特殊格式的内容提交外, 还有一种比较独特的表单. 通常的表单, 其内容可以通过
 * urlencoded 的方式编码内容形成报文体,在发送给服务器端,但是业务场景往往需要用户直接提交文件. 在
 * 前端HTML代码中,特殊表单与普通表单的差异在于该表单中可以含有file类型的控件,以及需要指定表单属性
 * enctype为multipart/form-data,如下
 * <form action="/upload" method="post" enctype="multipart/form-data">
 *    <label for="username">Username</label> <input type="text" name="username" id="username" />
 *    <label for="file">Filename</label> <input type="file" name="file" id="file" />
 *    <br />
 *    <input type="submit" name="submit" value="Submit" />
 * </form>
 * 
 * 浏览器在遇到 multipart/form-data表单提交时, 构造的请求报文与普通表单完全不同. 首先它的报头中最为特殊的如下
 * Content-Type: multipart/form-data; boundary=AaB03x
 * Content-Length: 18231
 * 
 * 它代表本次提交的内容是由多部分构成的, 其中 boundary=AaB03x 指定的是每部分内容的分界符, AaB03x是随机生成的一段
 * 字符串, 报文体的内容将通过在它前面添加 -- 进行分割, 报文结束时在它前后都加上 -- 表示结束. 另外, Content-Length
 * 的值必须确保是报文体的长度.
 * 
 * 假设上面的表单选择了一个名为 diveintonode.js的文件,并进行提交上传,那么生成的报文如下所示
 * 
 * --AaB03x\r\n
 * Content-Disposition: form-data; name="username"\r\n
 * \r\n
 * Jackson Tian\r\n
 * --AaB03x\r\n
 * Content-Disposition: form-data; name="file"; filename="diveintonode.js"\r\n
 * Content-Type: application/javascript\r\n
 * \r\n
 * ... contents of diveintonode.js ...
 * --AaB03x--
 * 
 * 普通的表单控件的报文体如下
 * --AaB03x\r\n
 * Content-Disposition: form-data; name="username"\r\n
 * \r\n
 * Jackson Tian\r\n
 * 
 * 文件控件形成的报文如下
 * --AaB03x\r\n
 * Content-Disposition: form-data; name="file"; filename="diveintonode.js"\r\n
 * Content-Type: application/javascript\r\n
 * \r\n
 * ... contents of diveintonode.js ...
 * 
 * 一旦我们知晓报文是如何构成的, 那么解析它就变得十分容易. 值得注意的一点是, 由于是文件上传,那么
 * 像普通表单, JSON 或 XML那样先接收内容再解析的方式将变得不可接受. 接受大小未知数据量时,我么
 * 需要十分谨慎,如下
 */
function(req,res){
    if(hasBody(req)){
        var done = function(){
            handle(req,res);
        };
        if(mime(req) === 'application/json'){
            parseJSON(req,done);
        }else if(mime(req) === 'application/xml'){
            parseXML(req,done);
        }else if(mime(req) === 'multipart/form-data'){
            parseMultipart(req,done);
        }
    }else{
        handle(req,res);
    }
};
/**
 * 这里我们将req这个流对象直接交给对应的解析方法, 由解析方法自行处理上传的内容,或接收内容并保存
 * 在内存中,或流式处理掉
 * 
 * 这里要介绍到的模块是 formidable, 它基于流式处理解析报文, 将接收到的文件写入到系统的临时文件夹中,
 * 并返回对应的路径,如下
 */
var formidable = require('formidable');
function(req,res){
    if(hasBody(req)){
        if(mime(req) === 'multipart/form-data'){
            var form = new formidable.IncomingForm();
            form.parse(req,function(err,fields,files){
                req.body = fields;
                req.files = files;
                handle(req,res);
            });
        }
    }else{
        handle(req,res);
    }
}
//因此在业务逻辑中只要检查 req.body 和 req.files 中的内容即可

/**
 * 4. 数据上传与安全
 * 主要介绍内存 和 CSRF 相关的安全问题
 * 
 * 4.1 内存限制
 * 在解析表单, JSON 和 XML 部分, 我们采取的策略是先保存用户提交的所有数据,然后在解析处理,最后才
 * 传递给业务逻辑. 这种策略存在潜在的问题,它仅仅适合数据量小的提交请求, 一旦数据量过大, 将发生内存
 * 被占光的情况. 攻击者通过客户端能够十分容易地模拟伪造大量数据,如果攻击者每次提交 1MB 的内容,那么
 * 只要并发请求数量一大,内存就会很快地被吃光.
 * 
 * 要解决这个问题主要有两个方案
 * > 限制上传内容的大小, 一旦超过限制, 停止接收数据, 并响应 400 状态码
 * > 通过流式解析, 将数据流导向到磁盘中, Node 只保留文件路径等小数据.
 * 
 * 流式处理在上文的文件上传中已经有所体现,这里介绍下Connect中采用的上传数据量的限制方式,如下
 */
var bytes = 1024;
function(req,res){
    var received = 0;
    var len = req.headers['content-length'] ? parseInt(req.headers['content-length'],10) : null;

    // 如果内容超过长度限制, 返回请求实体过长的状态码
    if(len && len > bytes){
        res.writeHead(413);
        res.end();
        return;
    }
    // limit
    req.on('data',function(chunk){
        received += chunk.length;
    })
}
/**
 * 从上面的代码中我们可以看到, 数据是有包含Content-Length 的请求报文判断是否长度超过限制的,超过则直接响应413状态码.
 * 对于没有Content-Length的请求报文, 略微简略一点, 在每个data事件中判定即可. 一旦超过限制值, 服务器停止接收新的数据
 * 片段. 如果是JSON文件或XML文件, 极有可能无法完成解析. 对于上线的Web应用, 添加一个上传大小限制十分有利于保护服务器,
 * 在遭遇攻击时,能镇定从容应对
 */

/**
 * 4.2 CSRF
 * CSRF的全称是 Cross-Site Request Forgery, 中文意思为跨站请求伪造. 前文提及了服务器端与客户端通过Cookie来标识和
 * 认证用户,通常而言,用户通过浏览器访问服务器端的Session ID 是无法被第三方知道的,但是CSRF的攻击者并不需要知道
 * Session ID 就能让用户中招.
 * 
 * 为了详细解释CSRF攻击是怎样一个过程, 这里以一个留言的例子来说明. 假设某个网站有这样一个留言程序,提交留言的接口
 * 如下
 * http://domain_a.com/guestbook
 * 
 * 用户通过POST提交content字段就能成功留言. 服务器端会自动从Session数据中判断是谁提交的 数据, 补足username 和
 * updatedAt 两个字段后向数据库中写入数据.如下
 */
function(req,res){
    var content = req.body.content || '';
    var username = req.session.username;
    var feedback = {
        username:username,
        content:content,
        updateAt:date.now()
    };
    db.save(feedback,function(err){
        res.writeHead(200);
        res.end('Ok');
    });
}
/**
 * 正常的情况下, 谁提交的留言, 就会在列表中显示谁的信息. 如果某个攻击者发现了这里的接口存在CSRF漏洞,那么他就可在另
 * 一个网站(http://domain_b.com/attack) 上构造了一个表单提交
 * <form id="test" method="POST" action="http://domain_a.com/guestbook">
 *    <input type="hidden" name="content" value="vim是这个最好" />
 * </form>
 * <script type="text/javascript">
 *    $(function(){
 *       $("#test").submit();
 *    });
 * </script>
 * 
 * 这种情况下, 攻击者只要引诱某个domain_a的登录用户访问这个domain_b的网站,就会自动提交一个留言. 由于在提交
 * 到 domain_a 的过程中, 浏览器会将 domain_a 的Cookie 发送到服务器, 尽管这个请求是来自 domain_b 的, 但
 * 是服务器并不知情,用户也不知情.
 * 
 * 以上过程就是一个CSRF攻击的过程. 这里的示例仅仅是一个留言的漏洞, 如果出现漏铜的是转账的接口,那么其危害程度可想而知
 * 
 * 尽管通过Node接收数据提交十分容易, 但是安全问题还是不容忽视. 好在CSRF并非不可防御, 解决CSRF攻击的方案有添加
 * 随机值的方式,如下
 */
var generateRandom = function(len){
    return crypto.randomBytes(Math.ceil(len * 3 / 4)).toString('base64')
                                                     .slice(0,len);
};
//也就是说,为每个请求的用户,在Session中赋予一个随机值,如下
var token = req.session._csrf || (req.session._csrf = generateRamdom(24));
//在做页面渲染的过程中,将这个_csrf值告诉前端,如下
/**
 * <form id="test" method="POST" action="http://domain_a.com/guestbook">
 *   <input type="hidden" name="content" value="vim之歌" />
 *   <input type="hidden" name="_csrf" value="<%=_csrf%>" />
 * </form>
 */