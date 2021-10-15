/**
 * 前面介绍了许多Web请求过程中的预处理过程, 对于不同的业务,我们还是期望有不同的处理方式,
 * 这带来了路由的选择问题.
 * 文件路径,  MVC, RESTful 等路由方式
 */

/**
 * 文件路径
 * 
 * 1. 静态文件
 * 这种方式的路由在路径解析的部分有过简单描述,其让人舒服的地方在于URL的路径与网站目录的路径一致,无须转换,非常直观.
 * 这种路由的处理方式也十分简单,将请求路径对应的文件发送给客户端即可. 这在前文路径解析部分
 * 2. 动态文件
 * 在MVC模式流行起来之前, 根据文件路径执行动态脚本也是基本的路由方式,它的处理原理是Web服务器根据URL路径找到对应的
 * 文件,如 /index.asp 或 /index.php. Web服务器根据文件名后缀去寻找脚本的解析器,并传入HTTP请求的上下文
 * 以下是Apache中配置PHP支持的方式: 
 * AddType application/x-httpd-php .php
 * 
 * 解析器执行脚本,并输出响应报文,达到完成服务的目的. 现今大多数的服务器都能很智能地根据后缀同时服务动态和静态文件.
 * 这种方式在Node中不太常见, 主要原因是文件的后缀都是.js, 分不清是后端脚本, 还是前端脚本, 这可不是什么好的设计.而
 * 且Node中Web服务器与应用业务脚本是一体的,无须按这种方式实现
 */

/**
 * MVC
 * 在MVC流行之前, 主流的处理方式都是通过文件路径进行处理的,甚至以为是常态. 直到有一天开发者发现用户请求的URL路径
 * 原来可以跟具体脚本所在的路径没有任何关系
 * 
 * MVC模型的主要思想是将业务逻辑按职责分离, 主要分为以下几种.
 * > 控制器(Controller), 一组行为的集合.
 * > 模型(Model),数据相关的操作和封装.
 * > 视图(View),视图的渲染
 * 
 * 这是目前最为经典的分层模式,大致而言, 它的工作模式如下
 * > 路由解析, 根据URL寻找到对应的控制器和行为.
 * > 行为调用相关的模型,进行数据操作.
 * > 数据操作结束后,调用视图和相关数据进行页面渲染,输出到客户端.
 * 
 * 控制器如何调用模型和如何渲染页面,各种实现都大同小异,我们在后续章节展开. 如何根据URL做路由映射,这里
 * 有两个分支实现. 一种方式是通过手工关联映射, 一种是自然关联映射. 前者会有一个对应的路由文件来将URL
 * 映射到对应的控制器, 后者没有这样的文件.
 * 
 * 
 *             /      |-------------|            |----------------|
 *           /       ^|   Router    |----------->|  Controller    |
 *  | User |/        |-------------|            |----------------|
 *  |------|                                           |
 *          <                                          |
 *           \
 *            \      |-------------|            |----------------|
 *             \     |  View       |<---------- |    Model       |
 *                   |-------------|            |----------------|
 * 
 * 
 * 1. 手工映射
 * 手工映射除了需要手工配置路由外较为原始外, 它对URL的要求十分灵活, 几乎没有格式上的限制. 如下的URL格式都能
 * 自由映射
 * /user/setting
 * /setting/user
 * 这里映射已经拥有了一个处理设置用户信息的控制器,如下
 * exports.setting = function(req,res){
 *    // TODO
 * }
 * 再添加一个映射的方法就行, 为了方便后续的行文, 这个方法名叫 use(), 如下
 * var routes = [];
 * var use = function(path,action){
 *     routes.push([path,action]);
 * };
 * 
 * 我们在入口程序中判断URL, 然后执行对应的逻辑, 于是就完成了基本的路由映射过程,如下
 */
function(req,res){
    var pathname = url.parse(req.url).pathname;
    for(var i = 0; i < routes.length; i++){
        var route = routes[i];
        if(pathname === route[0]){
            var action = route[1];
            action(req,res);
            return;
        }
    }
    // 处理404请求
    handle404(req,res);
}
/**
 * 手工映射十分方便,由于它对URL十分灵活, 所以我们可以将两个路径都映射到相同的业务逻辑,如下
 * use('/user/setting',exports.setting);
 * use('/setting/user',exports.setting);
 * //甚至
 * use('/setting/user/jacksontian',exports.setting);
 * 
 * 2. 正则匹配
 * 对于简单的路径,采用上述的硬匹配方式即可, 但是如下的路径请求就完全无法满足需求了: 
 * /profile/jacksontian
 * /profile/hoover
 * 
 * 这些请求需要根据不同的用户显示不同的内容,这里只有两个用户, 假如系统中存在成千上万个用户,
 * 我们就不太可能去手工维护所有用户的路由请求,因此正则匹配应运而生,我们期望通过以下的方式
 * 就可以匹配到任意用户
 * use('/profile/:username',function(req,res){
 *    // TODO
 * })
 * 
 * 于是我们改进我们的匹配方式, 在通过use注册路由时需要将路径转换为一个正则表达式, 然后通过它来进行匹配,
 * 如下
 */
// var pathRegexp = function(path){
//     path = path
//       .concat(strict ? '' : '/?')
//       .replace(/\/(/g,'(?:/')
//       .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g,function(_,slash,format,key,capture,optional,star){
//           slash = slash || '';
//           return ''
//           + (optional ? '' : slash)
//           + '(?:'
//           + (optional ? slash : '')
//           + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
//           + (optional || '')
//           + (star ? '(/*)?' : '');
//       })
//       .replace(/(\/.)/g,'\\$1')
//       .replace(/\*/g,'(.*)');
//     return new RegExp('^' + path + '$');
// }

/**
 * 上述正则表达式十分复杂,总体而言,它能实现如下的匹配: 
 * /profile/:username => /profile/jacksontian, /profile/jacksontian, /profile/hoover
 * /user.:ext => /user.xml, /user.json
 */