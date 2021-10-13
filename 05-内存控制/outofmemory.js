var showMem = function(){

}
var useMem = function(){
    var size = 20 * 1024 * 1024;
    var arr = new Array(size);
    for(var i = 0; i < size; i++) {
        arr[i] = 0;
    }
    return arr;
};

var total = [];
for(var j = 0; j < 15; j++){
    showMem();
    total.push(useMem());
}
showMem();

/**
 * 2. 查看系统的内存占用
 * 
 * 与 process.memoryUsage() 不同的是, os 模块中的 totalmem() 和 freemem()
 * 这两个方法用于查看操作系统的内存使用情况, 它们分别返回系统的总内存和闲置内存, 以
 * 字节为单位,如下: 
 * > node 
 * > os.totalmem();
 * > os.freemem();
 */

/**
 * 3. 堆外内存
 * 
 * 通过 process.memoryUsage() 的结果可以看到, 堆中的内存用量总是小于进程的常驻内存用量,
 * 这意味着 Node 中的内存使用并非都是通过 V8 进行分配的. 我们将那些不是通过 V8 分配的内存
 * 称为 对外内存.
 */