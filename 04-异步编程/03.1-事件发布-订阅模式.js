/**
 * 订阅 / 发布模式,
 * Node 自身提供的 events 模块是发布/订阅模式的一个简单实现,Node中部分模块
 * 都继承自它,这个模块比前端浏览器中的大量DOM事件简单,不存在事件冒泡,也不存在
 * preventDefault(), stopPropagation() 和 stopImmediatePropagation()
 * 等控制监听模式的方法实现.
 */

/**
 * Node对事件发布/订阅的机制做了一些额外的处理,这大多是基于健壮性而考虑的.如下:
 * > 如果对一个事件添加了超过10个监听器, 将会得到一条警告.
 * 该设计与Node自身但线程运行有关,设计者认为监听器太多可能导致内存泄露,所以存在
 * 这样一条警告. 调用 emitter.setMaxListeners(0); 可以将这个限制去掉. 另一
 * 方面, 由于事件发布会引起一系列监听器执行, 如果事件相关的监听器过多,可能存在
 * 过多占用CPU的情景.
 * 
 * > 为了处理异常, EventEmitter对象对error事件进行了特殊对待. 如果运行期间的错误
 * 触发了error事件, EventEmitter 会检查是否对error事件添加过监听器. 如果添加了,这个
 * 错误将会由该监听器处理, 否则这个错误将会作为异常抛出. 如果外部没有捕获这个异常,将会
 * 引起线程退出. 一个健壮的 EventEmitter 实例该对 error 事件做处理.
 */

/**
 * 1. 继承events模块
 * 实现一个继承 EventEmitter 的类很简单,如下:
 */
var events = require('events');
var util = require('util');
function Stream(){
    events.EventEmitter.call(this);
}
util.inherits(Stream,events.EventEmitter); /**已弃用 */

/**
 * Node 在util模块中封装了继承的方法,所以此处可以很便利的调用 开发者可以通过这样的方式轻松继承
 * EventEmitter类,利用事件机制解决业务问题. 在Node提供的核心模块中, 有近半数都继承自EventEmitter.
 */


/**
 * 2. 利用事件队列解决雪崩问题
 * > once() 方法,通过它添加的侦听器只能执行一次,在执行之后就会将它与事件的关联移除. 这个特性常常可以
 * 帮助我们过滤一些重复性的事件响应. 
 * > 雪崩问题, 就是在高访问量,大并发量的情况下缓存失效的情景,此时大量的请求同时涌入数据库中,数据库无法
 * 同时承受如此大的查询请求, 进而往前影响到网站整体的响应速度.
 * 
 * 如下是一条数据库查询语句的调用:
 */
var select = function(callback){
    db.select("SQL",function(results){
        callback(results);
    });
};
/**
 * 如果站点刚好启动,这是缓存中是不存在数据的, 而如果访问量巨大, 同一句SQL会被发送到数据库中反复查询, 会影响
 * 服务的整体性能. 一种改进方案是添加一个状态锁,如下:
 */
var status = "ready";
var select = function(callback){
    if(status === "ready"){
        status = "pending";
        db.select("SQL",function(results) {
            status = "ready";
            callback(results);
        })
    }
}
/**
 * 但是这种情况下, 连续地多次调用 select() 时, 只有第一次调用是生效的, 后续的 select()是没有数据服务的,
 * 这个时候可以引入事件队列,相关代码如下:
 */
var proxy = new events.EventEmitter();
var status = "ready";
var select = function(callback){
    proxy.once("selected",callback);
    if (status === "ready"){
        status = "pending";
        db.select("SQL",function(results){
            proxy.emit("selected",results);
            status = "ready";
        })
    }
}
/**
 * 这里我们利用了 once() 方法,将所有请求的回调都压入事件队列中, 利用其执行一次就会将监视器移除的特点,保证
 * 每一个回调只会被执行一次. 对于相同的SQL语句, 保证在每一个回调只会被执行一次. 对于相同的SQL语句, 保证在
 * 同一个查询开始到结束的过程中永远只有一次. SQL 在进行查询时,新到来的相同调用只需在队列中等待数据就绪即可,
 * 一旦查询结束,得到的结果可以被这些调用共同使用. 这种方式能节省重复的数据库调用产生的开销.
 */

/**
 * 3. 多异步之间的协作方案
 * 一般而言, 事件与侦听器的关系是多对一的情况,也就是说一个业务逻辑可能依赖两个通过回调或事件传递的结果.但在
 * 异步编程中,也会出现事件与侦听器的关系是多对一的情况,也就是说一个业务逻辑可能依赖两个通过回调或事件传递的结果.
 * 
 * 由于多个异步场景中回调函数的执行并不能保证顺序,且回调函数之间互相没有任何交集,所以需要借助一个第三方函数和第
 * 三方变量来处理异步协作的结果. 通常, 我们把这个用于检测次数的变量叫做哨兵变量. 利用偏函数来处理哨兵变量和第三方
 * 函数的关系了.
 */

var after = function(times,callback){
    var count = 0,results = {};
    return function(key,value) {
        results[key] = value;
        count++;
        if(count === times){
            callback(results);
        }
    };
};
var done = after(times,render);

/**
 * 上述方案实现了多对一的目的. 如果业务继续增长,我们依然可以继续利用发布/订阅方式来完成多对多的方案, 相关代码如下:
 */
var emitter = new events.Emitter();
var done = after(times,render);

emitter.on("done",done);
emitter.on("done",other);

fs.readFile(template_path,"utf8",function(err,template){
    emitter.emit("done","template",template);
});
db.query(sql,function(err,data){
    emitter.emit("done","data",data);
});
llon.get(function(err,resources){
    emitter.emit("done","resources",resources);
});
/**
 * 这种方案结合了前者用简单的偏函数完成多对一的收敛和事件订阅/发布模式中一对多的发散.
 * 
 * 在上面的方法中,有一个令调用者不那么舒服的问题,那就是调用者要去准备这个done()函数,
 * 以及在回调函数中需要从结果中把数据一个一个提取出来,再进行处理.
 * 
 * 另一个方案则是来自笔者自己写的 EventProxy 模块, 它是对事件订阅/发布模式的扩充,可以
 * 自由订阅组合事件. 由于依旧采用的是事件订阅/发布模式, 与Node十分契合,相关代码如下: 
 */

var proxy = new EventProxy();
proxy.all("template","data","resources",function(template,data,resources){
    // TODO
});

fs.readFile(template_path,"utf8",function(err,template){
    proxy.emit("template",template);
});
db.query(sql,function(err,data){
    proxy.emit("data",data);
});
llon.get(function(err,resources) {
    proxy.emit("resources",resources);
});

/**
 * EventProxy 提供了一个 all() 方法来订阅多个事件, 当每个事件都被触发之后, 侦听器才会执行. 另外的
 * 一个方法是 tail() 方法, 它与 all() 方法的区别在于 all() 方法的侦听器在满足条件之后只会执行一次,
 * tail() 方法的侦听器则在满足条件时执行一次之后, 如果组合事件中的某个事件被再次触发, 侦听器会用最新
 * 的数据继续执行. all() 方法带来的另一个改进则是: 在侦听器中返回数据的参数列表与订阅组合事件的事件
 * 列表是一致对应的.
 */

/**
 * 4. EventProxy 的原理
 */