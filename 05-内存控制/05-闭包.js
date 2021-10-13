/**
 * 我们知道作用域链上的对象访问只能向上, 这样外部无法向内部访问.如下
 */
var foo = function() {
    var local = "局部变量";
    (function(){
        console.log(local);
    }());
};
foo();

//但在下面的代码中, 却会得到 local 未定义的异常:
var foo2 = function() {
    (function(){
        var local = "局部变量2";
    }());
    console.log(local);
};
foo2();
// 在 JavaScript 中, 实现外部作用域访问内部作用域中变量的方法叫做 闭包(closure). 这得益于高阶
// 函数的特性: 函数可以作为参数 或者 返回值. 如下: 

var foo3 = function() {
    var bar = function() {
        var local = "局部变量3";
        return function() {
            return local;
        };
    };
    var baz = bar();
    console.log(baz());
};
/**
 * 一般而言, 在 bar() 函数执行完成后, 局部变量 local 将会随着作用域的销毁而被回收. 但是注意这里的特点
 * 在于返回值是一个匿名函数, 且这个函数中具备了访问 local 的条件. 虽然在后续的执行中, 在外部作用域中还
 * 是无法直接访问 local, 但是若要访问它, 只要通过这个中间函数稍作周转即可. 
 * 
 * 闭包是 JavaScript 的高级特性, 利用它可以产生很多巧妙的效果. 它的问题在于, 一旦有变量引用这个中间
 * 函数, 这个中间函数将不会释放, 同时也会使原始的作用域不会得到释放, 作用域中产生的内存占用也不会得到释放.
 * 除非不再有引用, 才会逐步释放.
 */