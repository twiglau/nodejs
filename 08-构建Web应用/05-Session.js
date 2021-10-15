/**
 * 通过Cookie, 浏览器和服务器可以实现状态的记录,但是Cookie并非是完美的,
 * 前文提及的体积过大就是一个显著的问题,最为严重的问题是Cookie可以在前后端进行修改,
 * 因此数据就极为容易被篡改和伪造. 如果服务器端有部分逻辑是根据Cookie中的isVIP字段
 * 进行判断, 那么一个普通用户通过修改Cookie就可以轻松享受到VIP服务了.综上所述,
 * Cookie对于敏感数据的保护是无效的
 * 
 * 为了解决Cookie敏感数据的问题,Session应运而生. Session的数据只保留在服务器端,客户
 * 端无法修改,这样数据的安全性得到一定的保障,数据也无须在协议中每次都被传递.
 * 
 * 虽然在服务器端存储数据十分方便,但是如果将每个客户和服务器中的数据一一对应起来, 这里有
 * 常见的两种实现方式
 */

/**
 * 1. 基于Cookie来实现用户 和 数据的映射
 * 虽然将所有数据都放在 Cookie 中不可取, 但是将口令放在 Cookie 中还是可以的. 因为口令
 * 一旦被篡改, 就丢失了映射关系, 也无法修改服务器端存在的数据了. 并且Session的有效期
 * 通常较短, 普遍的设置是 20 分钟, 如果在 20 分钟内客户端 和 服务器端没有交互产生, 服务器
 * 就将数据删除. 由于数据过期时间较短, 且在服务器存储数据, 因此安全性相对较高. 那么口令
 * 是如何产生的呢? 
 * 
 * 一旦服务器启用了Session, 它将约定一个键值作为Session的口令,这个值可以随意约定,比如Connect
 * 默认采用 connect_id, Tomcat 会采用 jsession_id等. 一旦服务器检查到用户请求Cookie中没有
 * 携带该值, 它就会为之生成一个值,这个值是唯一且不重复的值,并设置超时时间.
 */
var sessions = {};
var key = 'session_id';
var EXPIRES = 20 * 60 * 1000;
var generate = function(){
    var session = {};
    session.id = (new Date()).getTime() + Math.random();
    session.cookie = {
        expire: (new Date()).getTime() + EXPIRES
    };
    sessions[session.id] = session;
    return session;
};
//每个请求到来时, 检查Cookie中的口令与服务器端的数据,如果过期,就重新生成,如下
function(req,res){
    var id = req.cookies[key];
    if(!id){
        req.session = generate();
    }else{
        var session = sessions[id];
        if(session){
            if(session.cookie.expire > (new Date()).getTime()){
                // 更新超时时间
                session.cookie.expire = (new Date()).getTime() + EXPIRES;
                req.session = session;
            }else{
                // 超时了,删除旧的数据,并重新生成
                delete sessions[id];
                req.session = generate();
            }
        }else{
            // 如果session过期或口令不对,重新生成session
            req.session = generate();
        }
    }
    handle(req,res);
}
/**
 * 当然仅仅重新生成 Session 还不足以完成整个流程,还需要在响应给客户端时设置新的值,以便下次
 * 请求时能够对应服务器端的数据. 这里我们 hack 响应对象的 writeHead() 方法, 在它的内部注入设置
 * Cookie的逻辑,如下
 * var writeHead = res.writeHead;
 * res.writeHead = function() {
 *   var cookies = res.getHeader('Set-Cookie');
 * }
 */
