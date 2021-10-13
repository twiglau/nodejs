/**
 * UDP 又称用户数据包协议, 与TCP一样同属于 网络传输层. UDP 与 TCP 最大的不同是
 * UDP不是面向连接的. TCP中连接一旦建立, 所有的会话基于连接完成, 客户端如果要与
 * 另一个TCP服务通信, 需要另创建一个套接字来完成连接. 但在UDP中,一个套接字可以
 * 与多个UDP服务通信, 它虽然提供面向事务的简单不可靠信息传输信息, 在网络差的情况下
 * 存在丢包严重的问题, 但是由于它无须连接, 资源消耗低, 处理快速且灵活, 所以常常应用
 * 在那种偶尔丢一两个数据包也不会产生重大影响的场景, 比如音频,视频等. UDP 目前应用
 * 很广泛, DNS服务即是基于它实现的.
 */

//1. 创建UDP套接字
var dgram = require('dgram');
var server = dgram.createSocket('udp4');

//2. 创建UDP服务器端
//若想让UDP套接字接收网络消息, 只要调用 dgram.bind(port, [address]) 方法对网卡和端口
//进行绑定即可. 如下: 
server.on("message",function(msg,rinfo){
    console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
})
server.on("listening",function(){
    var address = server.address();
    console.log("server listening " + address.address + ":" + address.port);
});
server.bind(41234);

//该套接字将接收所有网卡上 41234 端口上的消息. 在绑定完成后, 将触发 listening 事件. 

//3. 创建UDP客户端
//接下来我们创建一个客户端与服务端进行对话,当套接字对象用在客户端时, 可以调用 send() 方法发送消息到
//网络中. send() 方法的参数如下: 
// socket.send(buf,offset,length,port,address, [callback])
// 这些参数分别为要发送的Buffer, Buffer的偏移, Buffer的长度, 目标端口, 目标地址, 发送完成后的回调.
/**
 * 与TCP套接字的 write() 相比, send() 方法的参数列表相对复杂, 但是它更灵活的地方在于可以随意发送数据
 * 到网络中的服务器端, 而TCP 如果要发送数据给另一个服务器端, 则需要重新通过套接字构造新的连接. 
 */

//4. UDP套接字事件
/**
 * UDP 套接字相对 TCP 套接字使用起来更简单, 它只是一个 EventEmitter 的实例, 而非Stream的实例. 它具备
 * 如下: 
 * message: 当UDP套接字侦听网端口后, 接收到消息时触发该事件, 触发携带的数据为消息Buffer对象和一个远程
 * 地址信息. 
 * listening: 当UDP套接字开始侦听时触发该事件. 
 * close: 调用close() 方法时触发该事件, 并不再触发 message 事件, 如需再次触发 message 事件,重新绑定即可. 
 * error: 当异常发生时触发该事件, 如果不侦听, 异常将直接抛出, 使进程退出
 */