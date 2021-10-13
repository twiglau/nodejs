/**
 * Buffer在使用场景中, 通常是以一段一段的方式传输. 以下是常见的从输入流中
 * 读取内容的示例代码:
 */
var fs = require('fs');
var rs = fs.createReadStream('test.md');
var data = '';
rs.on("data",function(chunk){
    data += chunk;
})
rs.on("end",function(){
    console.log(data);
})
/**
 * data 事件中获取的 chunk 对象即是 Buffer 对象. 对于初学者而言, 容易将Buffer当做字符串来
 * 理解, 所以在接受上面的实例时不会觉得有任何异常.
 * 
 * 一旦输入流中有宽字节编码时, 问题就会暴露出来. 如果你在通过Node开发的网站上看到 ? 乱码符号,
 * 那么该问题的起源多半来自于这里.
 * 这里潜藏的问题在于如下这句代码: 
 * data += chunk;
 * 
 * 这句代码里隐藏了 toString()操作, 它等价于如下的代码: 
 * data = data.toString() + chunk.toString();
 * 
 * 值得注意的是,外国人的语境通常是指英文环境,在它们的场景下,这个toString()不会造成任何问题. 但对于
 * 宽字节的中文, 却会形成问题. 为了重现这个问题,下面我们模拟近似的场景, 将文件可读流的每次读取的Buffer
 * 长度限制为11,代码如下: 
 * var rs = fs.createReadStream('test.md',{hightWaterMark: 11});
 */
var fs = require('fs');
var rs01 = fs.createReadStream('jing.md',{hightWaterMark:11});
var data01 = '';
rs01.on("data",function(chunk){
    data01 += chunk;
})
rs01.on("end",function(){
    console.log(data01);
})

//可能会产生乱码