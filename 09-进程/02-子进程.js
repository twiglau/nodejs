/**
 * 1. 创建子进程
 * child_process 模块给予 Node 可以随意创建子进程(child_process)的能力. 它提供了 4 个方法用于创建子进程
 * > spawn(): 启动一个子进程来执行命令.
 * > exec(): 启动一个子进程来执行命令, 与 spawn() 不同的是其接口不同, 它有一个回调函数获知子进程的状况.
 * > execFile(): 启动一个子进程来执行可执行文件.
 * > fork(): 与spawn()类似, 不同点在于它创建Node的子进程 只需指定要执行的 JavaScript 文件模块即可.
 * 
 * spawn() 与 exec(), execFile() 不同的是, 后两者创建时可以指定timeout属性设置超时时间, 一旦创建的进程运行
 * 超过设定的时间将会被杀死.
 * 
 * exec() 与 execFile() 不同的是, exec()适合执行已有的命令,execFile()适合执行文件. 这里我们以一个寻常命令为例,
 * node worker.js 分别用上述4种方法实现,如下
 * var cp = require('child_process');
 * cp.spawn('node',['worker.js']);
 * cp.exec('node worker.js', function(err,stdout,stderr){
 *     // some code
 * });
 * cp.execFile('worker.js',function(err,stdout,stderr){
 *     // some code
 * });
 * cp.fork('./worker.js');
 * 
 * 以上4个方法在创建子进程之后均会返回子进程对象. 其差别可以通过以下查看.
 * 
 * |  类型  |  回调/异常  |  进程类型  |  执行类型  |  可设置超时  |
 * |------- |-----------|----------|-----------|-------------|
 * | spawn()| X         |  任意      |  命令     |   X        |
 * |--------|-----------|-----------|-----------|------------|
 * | exec() |  ✔️       |  任意      |  命令     |    ✔️       |
 * |--------|-----------|-----------|-----------|------------|
 * |execFile()|  ✔️     |  任意      |可执行文件   |   ✔️       |
 * |--------|-----------|-----------|-----------|------------|
 * |fork()  |  X        |  Node     |JavaScript文件|  X       |
 * |--------|-----------|-----------|------------|-----------|
 * 
 * 这里的可执行文件是值可以直接执行的文件, 如果是JavaScript文件通过execFile()
 * 运行, 它的首行内容必须添加如下代码: 
 * #! /usr/bin/env node
 * 
 * 尽管4种创建子进程的方式有些差别, 但事实上后面3中方法都是 spawn() 的延伸应用.
 */


/**
 * 2. 进程间通信
 * 在Master-Worker模式中, 要实现主进程管理和调度工作进程的功能,需要主进程和工作进程之间的通信.
 * 对于child_process模块,创建好了子进程, 然后与父子进程间通信是十分容易的.
 * 
 * 在前端浏览器中, JavaScript主线程与UI渲染公用同一个线程. 执行JavaScript的时候UI渲染是停滞的,
 * 渲染UI时, JavaScript是停滞的, 两者互相阻塞. 长时间执行JavaScript将会造成UI停顿不响应.为了
 * 解决这个问题,HTML5提出了WebWorker API. WebWorker允许创建工作线程并在后台运行, 使得一些阻塞
 * 较为严重的计算不影响主线程上的UI渲染. 它的API如下
 * 
 * var worker = new Worker('worker.js');
 * worker.onmessage = function(event){
 *    document.getElementById('result').textContent = event.data;
 * };
 * 
 * 其中, worker.js 如下所示: 
 * var n = 1;
 * search: while(true) {
 *    n += 1;
 *    for(var i = 2; i <= Math.sqrt(n); i += 1)
 *       if( n%i == 0)
 *       continue search;
 *       // found a prime
 *    postMessage(n);
 * }
 * 
 * 主线程与工作线程之间通过 onmessage() 和 postMessage() 进行通信, 子进程对象则由 send() 方法实现主进程
 * 向子进程发送数据, message 事件实现收听子进程发来的数据, 与API在一定程度上相似. 通过消息传递内容,而不是共享
 * 或直接操作相关资源, 这是较为轻量和无依赖的做法.
 * 
 * Node中对应示例如下
 * parent.js
 */