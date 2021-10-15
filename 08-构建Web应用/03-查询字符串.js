/**
 * 查询字符串位于路径之后, 在地址栏中路径后的 ?foo=bar&baz=val 字符串就是查询字符串. 这个字符串会跟随
 * 在路径后, 形成请求报文首行的第二部分. 这部分内容经常需要为业务逻辑所用, Node提供了 querystring 模块
 * 用于处理这部分数据,如下: 
 * 
 * var url = require('url');
 * var querystring = require('querystring');
 * 
 * 更简洁的方法是给 url.parse() 传递第二个参数,如下: 
 * var query = url.parse(req.url,true).query;
 * 
 * 它会将 foo=bar&baz=val解析为一个JSON对象,如下: 
 * {
 *    foo: 'bar',
 *    baz: 'val'
 * }
 * 
 * 在业务调用产生之前, 我们的中间件 或者 框架
 */