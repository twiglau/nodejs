/**
 * Promises/A 来以点代面 介绍 Promise/Deferred 模式.
 * Promises/A 提议对单个异步操作做出了这样的抽象定义,具体如下
 * 
 * > Promise操作只会在3中状态的一种: 未完成态, 完成态 和 失败态.
 * > Promise的状态只会出现从未完成态向完成态或失败态转化,不能逆反.
 * 完成态和失败态不能互相转化.
 * > Promise的状态一旦转化, 将不能被更改.
 * 
 * 在API的定义上, Promises/A 提议是比较简单的. 一个Promise对象只要
 * 具备 then() 即可. 但是对于 then() 方法, 有以下简单的要求.
 * > 接受完成态, 错误态的回调方法. 在操作完成或出现错误时, 将会调用对应方法.
 * > 可选地支持progress事件回调作为第三个方法.
 * > then()方法只接受function 对象, 其余对象将被忽略.
 * > then()方法继续返回Promise 对象, 以实现链式调用.
 * 
 * then() 方法的定义如下:
 * > then(fulfilledHandler,errorHandler,progressHandler)
 * 
 * 为了演示 Promises/A 提议, 这里我们尝试通过继承 Node 的 events 模块来完成
 * 一个简单的实现,如下
 */
var Promise = function() {
    EventEmitter.call(this);
};
util.inherits(Promise,EventEmitter);
Promise.prototype.then = function(fulfilledHandler,errorHandler,progressHandler){
    if(typeof fulfilledHandler === 'function'){
        this.once('success',fulfilledHandler);
    }
    if(typeof errorHandler === 'function'){
        //利用once方法,保证异常回调只执行一次
        this.once('error',errorHandler);
    }
    if(typeof progressHandler === 'function'){
        this.on('progress',progressHandler);
    }
    return this;
};
/**
 * 这里看到 then() 方法所做的事情是将回调函数存放起来, 为了完成整个流程, 还需要触发执行这些回调的地方,
 * 实现这些功能的对象通常被称为 Deferred, 即延迟对象, 实例代码如下:
 */
var Deferred = function() {
    this.state = 'unfulfilled';
    this.promise = new Promise();
};

Deferred.prototype.resolve = function(obj){
    this.state = 'fulfilled';
    this.promise.emit('success',obj);
};
Deferred.prototype.reject = function(err){
    this.state = 'failed';
    this.promise.emit('error',err);
};
Deferred.prototype.progress = function(data){
    this.promise.emit('progress',data);
};

//利用Promises/A 提议的模式, 我们可以对一个典型的响应对象进行封装,相关代码如下
res.setEncoding('utf8');
res.on('data',function(chunk){
    console.log('BODY: ' + chunk);
});
res.on('end',function(){
    // Done
});
res.on('error',function(err){
    // Error
});
//上述代码可以转换为如下的简略形式:
res.then(function(){
    //Done
},function(err){
    //Error
},function(chunk){
    console.log('BODY: ' + chunk);
});
//要实现如此简单的API, 只需要简单地改造以下即可,相关代码如下
var promisify = function(res){
    var deferred = new Deferred();
    var result = '';
    res.on('data',function(chunk){
        result += chunk;
        deferred.progress(chunk);
    });
    res.on('end',function(){
        deferred.resolve(result);
    });
    res.on('error',function(err){
        deferred.reject(err);
    });
    return deferred.promise;
}

/**
 * 如此就得到了简单的结果. 这里返回 deferred.promise的目的是为了
 * 不让外部程序调用 resolve() 和 reject() 方法, 更改内部状态的行为
 * 交由定义者处理. 下面为定义好 Promise后的调用示例
 */
promisify(res).then(function(){
    // Done
},function(err){
    // Error
},function(chunk){
    // progress
    console.log('BODY: ' + chunk);
});
/**
 * 这里回到 Promise 和 Deferred 的差别上. 从上面的代码可以看出, Deferred 主要是用于
 * 内部, 用户维护异步模型的状态; Promise 则作用于外部, 通过 then() 方法暴露给外部以添加
 * 自定义逻辑. Promise 和 Deferred 的整体关系. 
 */

/**
 * Q 模块是 Promises/A 规范的一个实现, 可以通过 npm install q 进行安装使用. 它对Node中
 * 常见回调函数的 Promise实现如下:
 */
defer.prototype.makeNodeResolver = function(){
    var self = this;
}
//可以看到这里是一个高阶函数的使用, makeNodeResolver返回了一个Node风格的回调函数. 对于fs.readFile()
//的调用, 将会演化为如下形式
var readFile = function(file,encoding){
    var deferred = Q.defer();
    fs.readFile(file,encoding,deferred.makeNodeResolver());
    return deferred.promise;
}
//调用
readFile("foo.txt","utf-8").then(function(data){
    // Success case
},function(err){
    //Failed case
});
