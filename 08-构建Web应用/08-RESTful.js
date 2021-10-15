/**
 * REST 设计哲学主要将服务器端提供的内容实体看作一个资源,并表现在URL上
 * 比如一个用户的地址如下
 * /users/jacksontian
 * 
 * 这个地址代表了一个资源, 对这个资源的操作, 主要体现在HTTP请求方法上,不是体现在
 * URL上, 过去我们对用户的增删改查或许是如下这样设计URL的
 * POST /user/add?username=jacksontian
 * GET /user/remove?username=jacksontian
 * POST /user/update?username=jacksontian
 * GET /user/get?username=jacksontian
 * 
 * 操作行为主要提现在行为上,主要使用的请求方法是POST和GET. 在RESTful设计中,如下这样
 * POST /user/jacksontian
 * DELETE /user/jacksontian
 * PUT /user/jacksontian
 * GET /user/jacksontian
 * 
 * 它将DELETE 和 PUT 请求方法引入设计中,参与资源的操作和更改资源的状态
 * 
 * 在RESTful设计中, 资源的具体格式由请求报头中的Accept字段和服务器端的支持情况来决定.如果客户端
 * 同时接受JSON和XML格式的响应, 那么它的Accept字段值是如下这样的
 * Accept: application/json,application/xml
 * 
 * 靠谱的服务器端应该要顾及这个字段, 然后根据自己能响应的格式做出响应. 在响应报文中, 通过Content-Type
 * 字段告知客户端是什么格式,如下: 
 * Content-Type: application/json
 * 
 * 具体格式,我们称之为具体的表现. 所以REST的设计就是, 通过URL设计资源,请求方法定义资源的操作,通过Accept
 * 决定资源的表现形式
 * RESTful与MVC设计并不冲突,而且是更好的改进,相比MVC,RESTful只是将HTTP请求方法也加入了路由的过程,以及在URL
 * 路径上提现得更资源化
 * 
 * > 请求方法
 * 为了让Node能够支持RESTful需求,我们改进了我们的设计. 如果use是对所有请求方法的处理,那么在RESTful的场景下,
 * 我们需要区分请求方法设计.示例如下:
 */
var routes = {'all':[]};
var app = {};
app.use = function(path,action){
    routes.all.push([pathRegexp(path),action]);
};
['get','put','delete','post'].forEach(function(method){
    routers[method] = [];
    app[method] = function(path,action){
        routes[method].push([pathRegexp(path),action]);
    };
});
//上面的代码添加了 get(),put(),delete(),post() 4个方法后, 希望通过如下的方式完成路由映射: 
/**
 * //增加用户
 * app.post('/user/:username',addUser);
 * //删除用户
 * app.delete('/user/:username',removeUser);
 * //修改用户
 * app.put('/user/:username',updateUser);
 * //查询用户
 * app.get('/user/:username',getUser);
 * 
 * 这样的路由能够识别请求方法, 并将业务进行分发. 为了让分发部分更简洁,我们先将匹配的部分抽取为 match() 方法,如下
 */
var match = function(pathname,routes){
    for(var i = 0; i < routes.length; i++){
        var route = routes[i];
        //正则匹配
        var reg = route[0].regexp;
        var keys = route[0].keys;
        var matched = reg.exec(pathname);
        if(matched){
            //抽取具体值
            var params = {};
            for(var i = 0, l = keys.length; i < l ; i++){
                var value = matched[i + 1];
                if(value){
                    params[keys[i]] = value;
                }
            }
            req.params = params;
            var action = route[1];
            action(req,res);
            return true;
        }
    }
    return false;
};
// 然后改进我们的分发部分, 如下
function(req,res){
    var pathname = url.parse(req.url).pathname;
    //将请求方法变为小写
    var method = req.method.toLowerCase();
    if(routes.hasOwnPerperty(method)){
        //根据请求方法分发
        if(match(pathname,routes[method])){
            return;
        }else{
            //如果路径没有匹配成功,尝试让 all() 来处理
            if(match(pathname,routes.all)){
                return;
            }
        }
    }else{
        //直接让all()来处理
        if(match(pathname,routes.all)){
            return;
        }
    }
    //处理404请求
    handle404(req,res);
}