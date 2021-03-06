/**
 * Node 在网络安全上提供了 3个模块, 分别为 crypto, tls, https. 其中 crypto 主要用于加密解密,
 * SHA1, MD5 等加密算法都在其中有体现.
 * > tls模块提供了与 net 模块类似的功能, 区别在于它建立在 TLS/SSL加密的 TCP 连接上.
 * > 对于 https 而言, 它完全与 http 模块接口一致, 区别也仅在于它建立与安全的连接之上
 */

/**
 * 1. TLS / SSL
 * 是一个公钥/私钥的结构, 它是一个非对称的结构, 每个服务器和客户端都有自己的公私钥. 公钥用来加密要
 * 传输的数据, 私钥用来解密接收到的数据. 公钥和私钥是配对的, 通过公钥加密的数据, 只有通过私钥才能
 * 解密, 所以在建立安全传输之前, 客户端和服务端之间需要互换公钥. 客户端发送数据是要通过服务器端的
 * 公钥进行加密, 服务器端发送数据时需要客户端的公钥进行加密, 如此才能完成加密解密的过程.如下: 
 * 
 *                     加密                             解密
 *               |---------------|          |-----------------|
 *               | 服务器端公钥    |----传输-->| 服务器端私钥      |\
 *             / |---------------|          |-----------------| \|-----------|
 * |----------|                                                  | 服务器端   |
 * | 客户端    |                                                  |-----------|
 * |----------|\                                               /
 *              \      解密                             加密   /
 *                |--------------|           |---------------|
 *                | 客户端私钥     |<--传输----| 客户端公钥      |
 *                |--------------|           |---------------|
 * 
 * 客户端 和 服务端 交换秘钥
 * 
 * Node在底层采用的是 openssl 实现 TLS/SSL 的, 为此要生成公钥 和 私钥 可以通过 openssl 完成.
 * 我们分别为服务器端 和 客户端生成私钥, 如下: 
 * 
 * // 生成服务器端私钥
 * > openssl genrsa -out server.key 1024
 * // 生成客户端私钥
 * > openssl genrsa -out client.key 1024
 * 
 * 上述命令生成了两个 1024 位长的 RSA 私钥文件, 我们可以通过他继续生成公钥,如下: 
 * > openssl rsa -in server.key -pubout -out server.pem
 * > openssl res -in client.key -pubout -out client.pem
 * 
 * 公私钥的非对称加密虽好, 但是网络中依然可能存在窃听的情况, 典型的例子是中间人攻击. 客户端和服务端
 * 在交换公钥的过程中, 中间人对客户端扮演服务器的角色, 对服务器端扮演客户端的角色, 因此客户端 和 服务端
 * 几乎感受不到中间人的存在. 为了解决这种问题, 数据传输过程中还需要对得到的公钥进行认证, 以确认得到的公钥
 * 是出自目标服务器. 如果不能保证这种认证, 中间人可能会将伪造的站点响应给用户, 从而造成经济损失.
 * 
 * 中间人攻击如下: 
 * 
 * |----------|          |-------------|           |--------------|
 * | 客户端    |<---------| 中间人       |<----------| 服务器端      |
 * |----------|          |-------------|           |--------------|
 *                           ^\                    
 *                             \
 *                              \
 *                       |-------------|
 *                       | 伪装的服务    |
 *                       |   器端       |
 *                       |-------------|
 * 
 * 为了解决这个问题, TLS/SSL 引入了数字证书来进行认证. 与直接用公钥不同, 数字证书包含了服务器的名称和
 * 主机名, 服务器的公钥, 签名颁发机构的名称, 来自签名颁发机构的签名. 在连接建立前, 会通过证书中的签名
 * 确认收到的公钥是来自目标服务器的,从而产生信任关系
 */


/**
 * 2. 数字证书
 * 为了确保我们的数据安全, 现在我们引入了一个第三方: CA(Certificate Authority, 数字证书认证中心). CA的作用
 * 是为站点颁发证书, 且这个证书中具有 CA 通过自己的公钥 和 私钥 实现的签名.
 * 
 * 为了得到签名证书, 服务器端需要通过自己的私钥生成 CSR(Certificate Signing Request, 证书签名请求 )文件. CA
 * 机构将通过这个文件颁发属于该服务器的签名证书, 只要通过 CA 机构就能验证证书是否合法.
 * 
 * 通过 CA 机构颁发证书通常是一个繁琐的过程, 需要付出一定的精力和费用. 对于中小型企业而言, 多半是采用自签名证书来
 * 构建安全网络的. 所谓自签名证书, 就是自己扮演 CA 机构, 给自己的服务器端颁发签名证书. 以下为生成私钥, 生成CSR 文件,
 * 通过 私钥自签名 生成证书的过程:
 * > openssl genrsa -out ca.key 1024
 * > openssl req -new -key ca.key -out ca.csr
 * > openssl x509 -req -in ca.csr -signkey ca.key -out ca.crt
 * 
 * 其流程如下: 
 *           |-----------|             |------------|
 * --------->|     key   |------------>|    csr     |
 *           |-----------|             |------------|
 *               \                         /
 *                \                       /
 *              自签名                    /
 *                 \                    /
 *                  Y                  Y
 *               |------------------------|
 *               |          crt           |
 *               |------------------------|
 * 
 * 生成自签名证书示意图
 * 
 * 上述步骤完成了扮演 CA 角色需要的文件. 接下来回到服务器端, 服务器需要向 CA 机构
 * 申请签名证书. 在申请签名证书之前依然是要创建自己的 CSR 文件. 值得注意的是, 这个过程
 * 中的 Common Name 要匹配服务器域名, 否则在后续的认证过程中会出错. 如下是生成
 * CSR 文件所用的命令:
 * > openssl req -new -key server.key -out server.csr
 * 
 * 得到CSR文件后, 向我们自己的 CA 机构申请签名. 签名过程需要 CA 的证书 和 私钥参与, 最终
 * 颁发一个带有 CA 签名的证书, 如下: 
 * > openssl x509 -req -CA ca.crt -CAKey ca.key -CAcreateserial -in server.csr -out server.crt
 * 
 * 客户端在发起安全连接前会去获取服务器端的证书, 并通过 CA 的证书验证服务器端证书的真伪. 除了验证真伪外,通常还含有
 * 对服务器名称, IP地址等进行验证的过程. 这个验证过程如下: 
 * 
 * |--------------|                    |----------------|
 * |  客户端       |<-------------------|  服务器端       |
 * |--------------|                    |----------------|
 *        \                                 ^
 *         \                               /
 *        验证                            签名
 *           \                           /
 *            \ |----------------------|
 *             >|           CA         |
 *              |----------------------|
 * 
 * 客户端通过  CA  验证服务器端证书的真伪过程示意图
 * 
 * CA 机构将证书颁发给服务器端后, 证书在请求的过程中会被发送给客户端, 客户端需要通过
 * CA 的证书验证真伪. 如果是知名的 CA 机构, 它们的证书一般预装在浏览器中, 如果是自己
 * 扮演 CA 机构, 颁发自有签名证书则不能享受这个福利, 客户端需要获取到 CA 的证书才能
 * 进行验证.
 * 
 * 上述的过程中可以看出, 签名证书是一环一环地颁发的,但是在CA那里的证书是不需要上级证书参与签名
 * 的,这个证书我们通常称为根证书.  
 * 
 */


/**
 * TLS 服务
 * 
 * 1. 创建服务器端
 * 将构建服务所需要的证书都备齐之后, 我们通过 Node 的 tls 模块来创建一个安全的TCP服务, 这个服务是一个
 * 简单的 echo 服务,如下:
 * var tls = require('tls');
 * 
 * 启动上述服务后, 通过下面的命令可以测试证书是否正常: 
 * > openssl s_client -connect 127.0.0.1:8000
 * 
 * 2. TLS客户端
 * 为了完善整个体系, 接下来我们用Node来模拟客户端, 如同net模块一样,tls模块也提供了connect()方法来构建客户端.
 * 在构建我们的客户端之前,需要为客户端生成属于自己的私钥和签名,如下: 
 * // 创建私钥
 * > openssl genrsa -out client.key 1024
 * // 生成CSR
 * > openssl req -new -ke client.key -out client.csr
 * // 生成签名证书
 * > openssl x509 -req -CA ca.crt -CAkey ca.key -CAcreateserial -in client.csr -out client.crt
 * 
 * 并创建客户端, 代码如下:
 */
var tls = require('tls');
var fs = require('fs');
const { Server } = require('http');

var options = {
    key: fs.readFileSync('./keys/client.key'),
    cert: fs.readFileSync('./keys/client.crt'),
    ca: [ fs.readFileSync('./keys/ca.crt') ]
};
var stream = tls.connect(8000,options,function(){
    console.log('client connected',stream.authorized ? 'authorized' : 'unauthorized');
    process.stdin.pipe(stream);
});
stream.setEncoding('utf8');
stream.on('data',function(data){
    console.log(data);
});
stream.on('end',function(){
    Server.close();
});
/**
 * 启动客户端的过程中, 用到了为客户端生成的私钥, 证书, CA证书. 客户端启动之后可以在输入流中输入数据, 服务器端将
 * 会回应相同的数据
 */
