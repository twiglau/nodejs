/**
 * 需要关注的API
 * > setTimeout()
 * > setInterval()
 * > setImmediate()
 * > process.nextTick()
 */


/**
 * 定时器
 * setTimeout() 和 setInterval() 与浏览器中的API是一致的,分别用于单次和多次定时执行任务.
 * 调用setTimeout() 或 setInterval() 创建的定时器会被插入到定时器观察者内部的一个黑红树中.
 * 每次Tick执行时,会从该红黑树中迭代取出定时器对象,检查是否超过定时时间,如果超时,就形成一个事件,
 * 它的回调函数将立即执行.
 */

/**
 * process.nextTick()
 * 每次调用 process.nextTick()方法, 只会将回调函数放入队列中, 在下一轮Tick时取出执行. 定时器中
 * 采用红黑树的操作时间复杂度为 O(lg(n)), nextTick() 的时间复杂度为 O(1).相交之下, process.nextTick()更为高效.
 */

/**
 * setImmediate()
 * 它与process.nextTick()方法十分类似,都是将回调函数延迟执行. 在 Node v0.9.1 之前, setImmediate()
 * 还没有实现,那时候实现类似的功能主要是通过 process.nextTick() 来完成, 该方法的代码如下
 */


// process.nextTick(function(){
//     console.log('process 延迟执行');
// });
// console.log('process 正常执行');

// setImmediate(function(){
//     console.log('Immediate 延迟执行');
// });
// console.log('Immediate 正常执行');

/**
 * setImmediate() 和 process.nextTick() 之间是有细微差别的.从以上结果看出
 * > process.nextTick() 中的回调函数执行的优先级 要高于 setImmediate(). 这里的原因在于事件循环对观察者的检查是有先后顺序的.
 * process.nextTick() 属于 idle 观察者, setImmediate() 属于 check 观察者.
 * 
 * > 在每一次轮询检查中, idle 观察者先于 I/O 观察者, I/O 观察者先于 check 观察者.
 * 
 * > 在具体底层实现上, process.nextTick() 的回调函数保存在一个数组中, setImmediate() 的结果则保存在链表中.
 * > 在行为上, process.nextTick()在每轮循环中会将数组中的回调函数全部执行完, 而 setImmediate()在每轮循环中
 * 执行链表中的一个回调函数. 看以下实例.
 */

// 加入两个 nextTick()的回调函数
process.nextTick(() =>{
    console.log('nextTick延迟执行1');
});
process.nextTick(() =>{
    console.log('nextTick延迟执行2');
});
//加入两个setImmediate()的回调函数
setImmediate(()=> {
    console.log('setImmediate延迟执行1');
    //进入下次循环
    process.nextTick(() => {
        console.log('强势插入');
    });
});
setImmediate(() =>{
    console.log('setImmediate延迟执行2');
});
console.log('正常执行');
/**
 * 从执行结果上来看, 当第一个setImmediate() 的回调函数执行后, 并没有立即执行第二个,而是进入了下一轮循环,再次按照
 * > process.nextTick()优先, setImmediate()次后的顺序执行.
 * 之所以这样设计, 是为了保证每轮循环能够较快地执行结束,防止CPU占用过多而阻塞后续I/O调用的情况.
 */
