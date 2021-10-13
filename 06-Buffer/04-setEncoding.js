/**
 * 可读流还有一个设置编码的方法 setEncoding(),如下: 
 * readable.setEncoding(encoding);
 * 该方法的作用是让 data 事件中传递的不再是一个Buffer对象, 而是编码后的字符串.
 * 为此, 我们继续改进前面诗歌的程序
 */

 var fs = require('fs');
 var rs01 = fs.createReadStream('jing.md',{hightWaterMark:11});
 rs01.setEncoding('utf8');
 var data01 = '';
 rs01.on("data",function(chunk){
     data01 += chunk;
 })
 rs01.on("end",function(){
     console.log(data01);
 })

 /**
  * 在调用 setEncoding()时, 可读流对象在内部设置了一个decoder对象. 每次data
  * 事件都通过该 decoder 对象进行 Buffer 到字符串的解码, 然后传递给调用者. 是
  * 设置编码后, data 不再收到原始的 Buffer 对象. 但是这依旧无法解释为何设置编码
  * 后乱码问题被解决掉了
  * 
  * 最终乱码问题得以解决, 还是在于 decoder 的神奇之处, decoder 对象来自于
  * string_decoder 模块StringDecoder的实例对象. 
  */
 var StringDecoder = require('string_decoder').StringDecoder;
 var decoder = new StringDecoder('utf8');

 var buf1 = new Buffer([0xE5,0xBA,0x8A,0xE5,0x89,0x8D,0xE6,0x98,0x8E,0xE6,0x9C]);
 console.log(decoder.write(buf1));

 var buf2 = new Buffer([0x88,0xE5,0x85,0x89,0xEF,0xBC,0xE7,0x96,0x91,0xE6]);
 console.log(decoder.write(buf2));
 // Buffer() is deprecated due to security and usability issues. 
 // Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.