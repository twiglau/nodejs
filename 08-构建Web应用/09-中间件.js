/**
 * 中间件(middleware)来简化和隔离这些基础设施与业务逻辑之间的细节,让开发者能够关注在业务的开发上,
 * 以达到提升开发效率的目的
 * 
 * 中间件的含义借指了这种封装底层细节,为上层提供更方便服务的意义,并非限定在操作系统层面.这里要提到
 * 的中间件,就是为我们封装上文提及的所有HTTP请求细节处理的中间件,开发者可以脱离这部分细节,专注
 * 在业务上.
 * 
 * 一个基本的中间件会是如下的形式: 
 * var middleware = function(req,res,next){
 *     //TODO
 *     next();
 * };
 * 按照预期的设计,我们为具体的业务逻辑添加中间件应该是很轻松的事情,通过框架支持,能够将所有的基础功能支持串联起来,如下
 * app.use('/user/:username',querystring,cookie,session,function(req,res){
 *    // TODO
 * })
 * 
 * 这里的querystring, cookie, session 中间件与前文描述的功能大同小异如下
 */

// querystring解析中间件
var querystring = function(req,res,next){
    req.query = url.parse(req.url,true).query;
    next();
};
// cookie解析中间件
var cookie = function(req,res,next){
    var cookie = req.headers.cookie;
    var cookies = {};
    if(cookie){
        var list = cookie.split(';');
        for(var i = 0; i < list.length; i++){
            var pair = list[i].split('=');
            cookies[pair[0].trim()] = pair[1];
        }
    }
    req.cookies = cookies;
    next();
};
/**
 * 可以看到这里的中间件都是十分简洁的, 接下来我么需要组织其这些中间件. 这里我们将路由分离开来,将
 * 中间件和具体业务逻辑都看成业务处理单元,改进use()方法如下
 */
app.use = function(path){
    var handle = {
        //第一个参数作为路径
        path: pathRegexp(path),
        //其他的都是处理单元
        stack:Array.prototype.slice.call(arguments,1)
    };
    routes.all.push(handle);
}
/**
 * 改进后的 use() 方法将中间件都存进了 stack 数组中保存, 等待匹配后触发执行. 由于结构发生改变,
 * 那么我们的匹配部分也需要进行修改,如下所示
 */
var match = function(pathname,routes){
    for(var i = 0; i < routes.length; i++){
        var route = routes[i];
        // 正则匹配
        var reg = route.path.regexp;
        var matched = reg.exec(pathname);
        if(matched){
            //抽取具体值
            //代码省略
            //将中间件数组交给handle()方法处理
            handle(req,res,route.stack);
            return true;
        }
    }
    return false;
};
/**
 * 一旦匹配成功,中间件具体如何调动都交给了 handle() 方法处理, 该方法封装后, 递归性地执行数组中的中间件,
 * 每个中间件执行完成后,按照约定调用传入next()方法以触发下一个中间件执行(或者直接响应),直到最后的业务逻辑,
 * 代码如下
 */
var handle = function(req,res,stack){
    var next = function(){
        //从stack数组中取出中间件并执行
        var middleware = stack.shift();
        if(middleware){
            //传入next()函数自身, 是中间件能够执行结束后递归
            middleware(req,res,next);
        }
    };
    // 启动执行
    next();
};
/**
 * 这里带来的疑问是, 像querystring,cookie,session这样基础的功能中间件是否需要为每个路由都进行
 * 设置呢? 如果都设置将会演变成如下的路由配置
 * app.get('/user/:username',querystring,cookie,session,getUser);
 * app.put('/user/:username',querystring,cookie,session,updateUser);
 * //更多路由
 * 
 * 为每个路由都配置中间件并不是一个好的设计,既然中间件和业务逻辑是等价的, 那么我们是否可以将路由和中间件
 * 进行结合? 设计是否可以更人性? 既能照顾普世的需求,又能照顾特殊的需求? 答案是 Yes,如下
 * app.use(querystring);
 * app.use(cookie);
 * app.use(session);
 * app.get('/user/:username',getUser);
 * app.put('/user/:username',authorize,updateUser);
 * 
 * 为了满足更灵活的设计, 这里持续改进我们的 use() 方法以适应参数的变化,如下
 */
app.use = function(path){
    var handle;
    if(typeof path === 'string'){
        handle = {
            //第一个参数作为路径
            path: pathRegexp(path),
            //其他的都是处理单元
            stack:Array.prototype.slice.call(arguments,1)
        };
    }else{
        handle = {
            //第一个参数作为路径
            path: pathRegexp('/'),
            //其他的都是处理单元
            stack:Array.prototype.slice.call(arguments,0)
        };
    }
    routes.all.push(handle);
}
/**
 * 除了改进use()方法外, 还要持续改进我们的匹配过程, 与前面一旦一次匹配后就不再执行后续匹配不同,还会继续后续逻辑,这
 * 里我们将所有匹配到中间件的都暂时保存起来,如下
 */
var match = function(pathname,routes){
    var stacks = [];
    for(var i = 0; i < routes.length; i++){
        var route = routes[i];
        //正则匹配
        var reg = route.path.regexp;
        var matched = reg.exec(pathname);
        if(matched){
            //抽取具体值
            //代码省略
            //将中间件都保存起来
            stacks = stacks.concat(route.stack);
        }
    }
    return stacks;
};
//改进完 use() 方法后, 还要持续改进分发的过程: 
function(req,res){
    var pathname = url.parse(req.url).pathname;
    //将请求方法变为小写
    var method = req.method.toLowerCase();
    //获取all()方法里的中间件
    var stacks = match(pathname,routes.all);
    if(routes.hasOwnPerperty(method)){
        //根据请求方法分发,获取相关的中间件
        stacks.concat(match(pathname,routes[method]));
    }
    if(stacks.length){
        handle(req,res,stacks);
    }else{
        //处理404请求
        handle404(req,res);
    }
}
