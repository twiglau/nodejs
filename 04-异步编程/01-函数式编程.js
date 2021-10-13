/**
 * 1. 高阶函数
 */

/**
 * 2. 偏函数
 * 偏函数的用法是指创建一个调用另外一个部分 --- 参数或变量已经预置的函数 --- 函数的用法.
 * 以实例来说明
 */
var toString = Object.prototype.toString;
var isString = function(obj){
    return toString.call(obj) == '[object String]';
};
var isFunction = function(obj){
    return toString.call(obj) == '[object Function]';
};
/**
 * 在JavaScript中进行类型判断时, 我们通常会进行类似上述代码的方法定义. 这段代码固然不复杂,只有
 * 两个函数的定义, 但是里面存在的问题是我们需要重复去定义一些相似的函数, 如果有更多的 isXXX(),就
 * 会出现更多的冗余代码. 为了解决重复定义的问题,我们引入一个新函数,这个新函数可以如 工厂一样批量
 * 创建一些类似的函数. 在下面的代码中, 我们通过 isType() 函数预先指定 type 的值, 然后返回一个新
 * 的函数
 */
var isType = function(type){
    return function(obj){
        return toString.call(obj) == '[object ' + type + ']'
    };
};
var isString = isType('String');
var isFunction = isType('Function');
//以上通过指定部分参数来产生一个新的定制函数的形式就是偏函数.
//偏函数应用在异步编程中也十分常见, 著名类库 Underscore 提供的 after() 方法即是偏函数应用,定义如下
_.after = function(times,func) {
    if(times <= 0) return func();
    return function(){
        if(--times < 1) { return func.apply(this,arguments) };
    };
};
//该函数可以根据传入的 times 参数和具体方法, 生成一个需要调用多次才真正执行实际函数的函数.