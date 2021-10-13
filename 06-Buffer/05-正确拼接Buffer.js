/**
 * 淘汰掉 setEncoding()方法后, 剩下的解决方案只有将多个小 Buffer 对象拼接
 * 为一个 Buffer 对象, 然后通过 iconv-lite 一类的模块来转码这种方式. += 的
 * 方式显然不行, 那么正确的Buffer拼接方法应该如下面展示的形式: 
 */

/*
var chunks = [];
var size = 0;
var fs = require('fs');
var rs01 = fs.createReadStream('jing.md',{hightWaterMark:11});
var data01 = '';
rs01.on("data",function(chunk){
    chunks.push(chunks);
    size += chunk.length;
})
rs01.on("end",function(){
    var buf = Buffer.concat(chunks,size);
    // var str = iconv.decode(buf,'utf8');
    console.log(buf);
})
*/