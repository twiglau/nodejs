/**
 * Cookie的处理分为如下几步
 * > 服务器向客户端发送Cookie
 * > 浏览器将Cookie保存
 * > 之后每次浏览器都会将Cookie发现服务器端
 */

/**
 * 客户端发送的Cookie在请求报文的Cookie字段中, 我们可以通过curl工具构造这个字段,如下
 * > curl -v -H "Cookie: foo=bar; baz=val" "http://127.0.0.1:1337/path?foo=bar&foo=baz"
 * 
 * HTTP_Parser会将所有的报文字段解析到req.headers上, 那么Cookie就是req.headers.cookie. 根据规范
 * 中的定义, Cookie值的格式是key=value;key2=value2形式的,如果我们需要Cookie,解析它也十分容易,如下: 
 */
var parseCookie = function(cookie){
   var cookies = {};
   if(!cookie){
     return cookies;
   }
   var list = cookie.split(';');
   for(var i = 0; i < list.length; i++){
       var pair = list[i].split('=');
       cookies[pair[0].trim()] = pair[1];
   }
   return cookies;
};
//在业务逻辑代码执行之前,我们将其挂载在req对象上,让业务代码可以直接访问,如下
function(req,res){
    req.cookies = parseCookie(req.headers.cookie);
    hande(req,res);
}
//这样我们的业务代码就可以进行判断处理了,如下: 
var handle = function(req,res){
    res.writeHead(200);
    if(!req.cookies.isVisit){
        res.end('欢迎第一次来到动物园');
    }else{
        //TODO
    }
};
/**
 * 任何请求报文中, 如果Cookie值没有isVisit, 都会收到 "欢迎第一次来到动物园" 这样的响应.
 * 这里提出一个问题, 如果识别到用户没有访问过我们的站点, 那么我们的站点是否应该告诉客户端
 * 已经访问过的标识呢? 告知客户端的方式是通过响应报文实现的, 响应的Cookie值在Set-Cookie
 * 字段中. 它的格式与请求中的格式不太相同,规范中对它的定义如下
 * Set-Cookie: name=value; Path=/; Expires=Sun, 23-Apr-23 09:01:35 GMT; Domain=.domain.com;
 * 
 * 其中name=value是必须包含的部分,其余部分皆是可选参数. 这些可选参数将会影响浏览器在后续将Cookie发送给
 * 服务器端的行为.
 * 
 * > path表示这个Cookie影响到的路径,当前访问的路径不满足该匹配时,浏览器则不发送这个Cookie
 * 
 * > Expires 和 Max-Age 是用来告知浏览器这个Cookie何时过期的,如果不设置该选项,在关闭浏览器时会
 * 丢失掉这个Cookie. 如果设置了过期时间, 浏览器将会把Cookie内容写入到磁盘中并保存,下次打开浏览器依旧有效.
 * Expires的值是一个UTC格式的时间字符串, 告知浏览器此Cookie何时将过期,Max-Age则告知浏览器此Cookie
 * 多久后过期. 前者一般而言不存在问题, 但是如果服务器端的时间和客户端的时间不能匹配,这种时间设置就会存在偏差,为此,
 * Max-Age则告知浏览器此Cookie多久后过期,而不是一个具体的时间点
 * 
 * > HttpOnly告知浏览器不允许通过脚本 document.cookie 去更改这个Cookie值, 事实上,设置HttpOnly之后,这个值
 * 在document.cookie中不可见. 但是在HTTP请求的过程中,依然会发送这个Cookie到服务器端.
 * 
 * > Secure. 当Secure值为true时,在HTTP中是无效的,在HTTPs中才有效,表示创建的Cookie只能在HTTPS连接中被浏览器
 * 传递到服务器端进行会话验证,如果是HTTP连接则不会传递该信息,所以很难被窃听到
 * 
 * 知道Cookie在报文头中的具体格式后,下面我们将Cookie序列化成复合规范的字符串,如下
 */

/**
 * 2. Cookie的性能影响
 * 由于Cookie的实现机制, 一旦服务器端向客户端发送了设置Cookie的意图,除非Cookie过期,否则客户端每次请求都会发送
 * 这些Cookie到服务器端, 一旦设置的Cookie过多,将会导致报头较大. 大多数的Cookie并不需要每次都用上,因为这会造成
 * 带宽的部分浪费. 在YSlow的性能优化规则中有这么一条
 * > 减小Cookie的大小
 * > 为静态组件使用不同的域名
 * > 减少DNS查询
 */