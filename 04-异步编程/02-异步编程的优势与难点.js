/**
 * 1. 优势
 * > Node 带来的最大特性莫过于基于事件驱动的非阻塞I/O模型.
 * 非阻塞I/O可以是CPU与I/O并不相互依赖等待,让资源得到更好的利用.
 */

/**
 * 2. 难点
 * > 异常处理
 * try...catch...final 捕获不了异步错误. 如下:
 * 
 * var async = function (callback) {
 *    process.nextTick(callback);
 * }
 * 调用 async() 方法后, callback 被存放起来, 知道下一个事件循环(Tick)才会取出来执行. 
 * 尝试对异步方法进行 try/catch操作只能捕获当次事件循环内的异常, 对callback执行时抛出
 * 的异常将无能为力. 实例如下:
 * try { async(callback); } catch (e) { //TODO }
 * 
 * Node 在处理异常上形成一种约定, 将异常作为回调函数的第一个实参返回, 如果为空值, 则表明
 * 异步调用没有异常抛出:
 * async(function(err,results) {
 *    //TODO
 * });
 * 
 * --- 自行编写的异步方法上, 也需要去遵循这样一些原则
 *  -> 必须执行调用者传入的回调函数.
 *  -> 正确传递异常调用者判断.
 * 如下示例:
 */

var async = function (callback){
    process.nextTick(function(){
        var results = something;
        if(error){
            return callback(error);
        }
        callback(null,results);
    });
};
//在异步方法的编写中, 另一个容易犯的错误是对用户传递的回调函数进行异常捕获,如下:
try {
    req.body = JSON.parse(buf,options.reviver);
    callback();
} catch (error) {
    err.body = buf;
    err.status = 400;
    callback(err);
}
/**
 * 上述代码的意图是捕获 JSON.parse() 中可能出现的异常, 但是却不小心包含了用户传递的回调函数.
 * 这意味着如果回调函数中有异常抛出, 将会进入 catch() 代码块中执行, 于是回调函数将会被 执行两次,
 * 这显然不是预期的情况, 可能导致业务混乱. 正确的捕获应当为:
 */
try {
    req.body = JSON.parse(buf,options.reviver);
} catch(error){
    err.body = buf;
    err.status = 400;
    return callback(err);
}
callback();


/**
 * 3. 难点 函数嵌套过深
 * 在网页渲染的过程中, 通常需要数据, 模板, 资源文件, 这三者互相之间并不依赖,但最终渲染结果中三者缺一不可. 
 * 如果采用默认的异步方法调用,程序也许将会如下所示:
 */
fs.readFile(template_path,'utf8',function(err,template){
    db.query(sql,function(err,data){
        llon.get(function(err,resources){
            // TODO
        });
    });
});
/**
 * 以上结果是没有问题的,问题在于这并没有利用好异步I/O带来的并行优势. 这是异步编程的典型问题.
 */

/**
 * 4. 难点 阻塞代码
 * JavaScript 中没有sleep()这样的线程沉睡功能, 唯独能用于延时操作的只有setInterval() 和 setTimeout() 这
 * 两个函数. 但是让人惊讶的是, 这两个函数并不能阻塞后续代码的持续执行.所以,有多半的开发者会写一下代码实现
 * sleep(1000)的效果:
 * var start = new Date();
 * while(new Date() - start < 1000){
 *   //TODO
 * }
 * 
 * 以上是糟糕的,这段代码会持续占用CPU进行判断,与真正的线程沉睡相去甚远,完全破坏了事件循环的调度.
 * 由于Node单线程的原因, CPU资源全部会用于为这段代码服务,导致其余任何请求都会得不到响应.
 * 
 * 遇见这样的需求时, 在统一规划业务逻辑之后, 调用 setTimeout() 的效果会更好.
 */


/**
 * 5. 难点 多线程编程
 * 
 * Web workers, 它通过将JavaScript执行与UI渲染分离,可以很好地利用多核CPU为大量计算服务.
 * 同时前端Web Workers也是一个利用消息机制合理使用多核CPU的理想模型.
 * 
 * 另外 Web workers能解决利用CPU和减少阻塞UI渲染,但是不能解决UI渲染的效率问题.
 * Node借鉴了这个模式, child_process 是其基础API, cluster模块是更深层次的应用. 借助
 * Web Workers的模式,开发人员要更多地去面临跨线程的编程.
 */


/**
 * 6. 难点 异步转同步
 */