/**
 * 某个中间件出现错误该怎么办? 我们需要为自己构建的Web应用的稳定性和健壮性负责.
 * 于是我们为 next() 方法添加 err 参数, 并捕获中间件直接抛出的同步异常,如下
 */
var handle = function(req,res,stack){
    var next = function(err){
        if(err){
            return handle500(err,req,res,stack);
        }
        //从stack数组中取出中间件执行
        var middleware = stack.shift();
        if(middleware){
            //传入next()函数自身, 使中间件能够执行结束后递归
            try {
                middleware(req,res,next);
            } catch (error) {
                next(err);
            }
        }
    };

    //启动执行
    next();
};
/**
 * 由于异步方法的异常不能直接捕获,中间件异步产生的异常需要自己传递出来,如下所示
 */
var session = function(req,res,next){
    var id = req.cookies.sessionid;
    store.get(id,function(err,session){
        if(err){
            //将异常通过next()传递
            return next(err);
        }
        req.session = session;
        next();
    });
};
/**
 * Next()方法接到异常对象后, 会将其交给handle500()进行处理. 为了将中间件的思想延续下去,我们认为进行异常
 * 处理的中间件也是能进行数组式处理的. 由于要同时传递异常, 所以用于处理异常的中间件的设计与普通中间件略有差别,它的参数有
 * 4个, 如下
 * var middleware = function(err,req,res,next){
 *    // TODO
 *    next();
 * };
 * 我们通过use()可以将所有异常处理的中间件注册起来,如下
 * app.use(function(err,req,res,next){
 *    // TODO
 * });
 * 
 * 为了区分普通中间件和异常处理中间件, handle500()方法将会对中间件按参数进行选取,然后递归执行
 */
var handle500 = function(err,req,res,stack){
    //选取异常处理中间件
    stack = stack.filter(function(middleware){
        return middleware.length === 4;
    });
    var next = function(){
        // 从stack数组中取出中间件并执行
        var middleware = stack.shift();
        if(middleware){
            //传递异常对象
            middleware(err,req,res,next);
        }
    };
    //启动执行
    next();
};