/**
 * ASCII
 * UTF-8
 * UTF-16LE/UCS-2
 * Base64
 * Binary
 * Hex
 */

// 1. 字符串 转 Buffer
/**
 * new Buffer(str, [encoding]);
 * 通过构造函数转换的Buffer对象,存储的只能是一种编码类型. encoding参数不传递时, 默认按UTF-8编码进行转码的存储.
 * 
 * 一个Buffer对象可以存储不同编码类型的字符串转码的值, 调用write()方法可以实现该目的
 * buf.write(string, [offset], [length], [encoding])
 */

//2. Buffer 转 字符串
/**
 * buf.toString( [encoding], [start], [end])
 */

//3. Buffer 不支持的编码类型
/**
 * Node的Buffer对象支持的编码类型有限, 只有少数的几种编码类型可以在字符串和Buffer之间转换. 为此, Buffer提供了一个
 * isEncoding() 函数来判断编码是否支持转换: 
 * Buffer.isEncoding(encoding)
 * 
 * 将编码类型作为参数传入上面的函数, 如果支持转换返回值为true, 否则为false. 很遗憾的是, 在中国常用的GBK,GB2312 和 BIG-5
 * 编码都不在支持的行列中.
 * 
 * 对于不支持的编码类型, 可以借助Node生态圈中的模块完成转换. iconv 和 iconv-lite 两个模块可以支持更多的编码类型转换, 包括
 * Windows 124 系列, ISO-8859 系列, IBM/DOS 代码页系列, Macintosh系列, KO18系列, 以及Latin1, US-ASCII, 也支持宽字
 * 节编码GBK 和 GB2312.
 * 
 * iconv-lite 采用纯 javaScript 实现, iconv 则通过 C++ 调用 libiconv 库完成. 前者比后者更轻量, 无须编译和处理环境依赖直接
 * 使用. 在性能方面, 由于转码都是耗用CPU, 在V8的高性能下, 少了 C++ 到 JavaScript 的层次转换, 纯JavaScript的性能比C++实现的
 * 更好.
 */

//Error: Cannot find module 'iconv-lite'
/**
 * 
 * var iconv = require('iconv-lite');
 * // Buffer 转字符串
 * var str = iconv.decode(buf,'win1251');
 * // 字符串转Buffer
 * var buf = iconv.encode("Sample input string",'win1251');
 */

var iconv = new Iconv('UTF-8','ASCII');
iconv.convert('ca va');
var iconv = new Iconv('UTF-8','ASCII//IGNORE');
iconv.convert('ca va');
var iconv = new Iconv('UTF-8','ASCII//TRANSLIT');
iconv.convert('ca va');
var iconv = new Iconv('UTF-8','ASCII//TRANSLIT//IGNORE');
iconv.convert('ca va aa');