/**
 * 查看垃圾回收日志的方式主要是在启动时添加 --trace_gc 参数.
 * 
 * 在进行垃圾回收时, 将会从标准输出中打印垃圾回收的日志信息. 下面如下, 将会在
 * gc.log 文件中得到所有垃圾回收信息:
 * > node --trace_gc -e "var a = [];for(var i = 0; i < 1000000; i++) a.push(new Array(100));" > gc.log
 */

/**
 * 通过分析垃圾回收日志, 可以了解垃圾回收的运行状况, 找出垃圾回收的哪些阶段比较耗时,触发的原因是什么?
 * 
 * 通过在Node启动时使用 --prof 参数,可以得到 V8 执行时的性能分析数据, 其中包含了垃圾回收执行时占用的时间.
 * 下面的代码不断创建对象并将其分配给局部变量 a. 存为 test01.js 文件
 * 
 * for(var i = 0; i < 1000000; i++) {
 *    var a = {};
 * }
 * 然后执行以下命令: 
 * > node --prof test01.js
 * 这将会在目录下得到一个 v8.log 日志文件, 该日志文件基本不具备可读性, 内容如下: 
 * *********
 * 
 * 所幸, V8 提供了 linux-tick-processor 工具用于统计日志信息. 该工具可以从Node 源码的 deps/v8/tools 目录下找到,
 * Windows 下的对应命令文件为 widows-tick-proccessor.bat. 将该目录添加到环境变量 PATH 中, 即可直接调用: 
 * > linux-tick-processor v8.log
 */