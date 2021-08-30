/**
 * 主要分为模块引用, 模块定义 和 模块标识3个部分.
 */

/**
 * 1. 模块引用
 * 模块引用的示例代码
 * var math = require('math');
 * 在CommonJS规范中,存在require()方法,这个方法接受模块标识, 以此引入一个模块
 * 的API到当前上下文中.
 */

/**
 * 2. 模块定义
 * 在模块中, 上下文提供 require() 方法来引入外部模块. 对应引入的功能, 上下文提供了
 * exports 对象用于导出当前模块的方法或者变量, 并且它是唯一导出的出口. 在模块中,还
 * 存在一个 module 对象,它代表模块自身,而 exports 是module的属性. 在Node中,一个
 * 文件就是一个模块,将方法挂载在 exports 对象上作为属性即可定义导出的方式:
 * 
 * //math.js
 * exports.add = function(){
 *    var sum = 0,
 *      i = 0,
 *      args = arguments,
 *      l = args.length;
 *    while( i < 1){
 *      sum += args[i++];
 *    }
 *    return sum;
 * };
 * 
 * 在另一个文件中,我们通过require()方法引入模块后, 就能调用定义的属性或方法了:
 * 
 * //program.js
 * var math = require('math');
 * exports.increment = function(val){
 *   return math.add(val, 1);
 * };
 */


/**
 * 3. 模块标识
 * 模块标识其实就是传递给 require()方法的参数, 它必须是复合小驼峰命名的字符串,或者
 * 已 . 或 .. 开头的相对路径, 或者绝对路径. 它可以没有文件名后缀 .js
 * 模块的定义十分简单, 接口也十分简洁. 它的意义在于将类聚的方法和变量等限定在私有的作用
 * 域中, 同时支持引入和导出功能以顺畅地连接上下游依赖.
 */