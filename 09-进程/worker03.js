// worker.js
var http = require('http');
var server = http.createServer(function (req,res) {
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end('handled by child, pid is ' + process.pid + '\n');
    //为了模拟未捕获的异常,我们想工作进程的而处理代码改为抛出异常,一旦有用户请求,
    //就会有一个可伶的工作进程退出
    throw new Error('throw exception');
});

var worker;
process.on('message',function(m,tcp){
    if(m === 'server'){
        worker = tcp;
        worker.on('connection',function(socket){
            server.emit('connection',socket);
        });
    }
});
process.on('uncaughtException',function(){
    // 增加一个自杀(suicide)信号
    process.send({act: 'suicide'});
    // 主进程在接收到自杀信号后,立即创建新的工作进程服务

    //停止接收新的连接
    worker.close(function(){
        //所有已有连接断开后, 退出进程
        process.exit(1);
    });
});