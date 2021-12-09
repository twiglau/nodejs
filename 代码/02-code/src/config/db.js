/**
 * @description 存储配置
 * @author 小康
 * @website https://xiaokang.me
 */

let REDIS_CONF = {
  port: 6379,
  host: '127.0.0.1'
}
let MYSQL_CONF = {
  host: 'localhost',
  dialect: 'mysql',
  user: 'root',
  password: 'Lzy1990052812',
  port: '3306',
  database: 'koa2_weibo_db'
}
// 判断线上环境还是线下环境
if (process.env === 'dev') {
  REDIS_CONF = {
    port: 6379,
    host: '127.0.0.1'
  }
  MYSQL_CONF = {
    host: 'localhost',
    dialect: 'mysql',
    user: 'root',
    password: 'root',
    port: '3306',
    database: 'koa2_weibo_db'
  }
} else {
  REDIS_CONF = {
    port: 6379,
    host: '127.0.0.1'
  }
  MYSQL_CONF = {
    host: 'localhost',
    dialect: 'mysql',
    user: 'root',
    password: 'root',
    port: '3306',
    database: 'koa2_weibo_db'
  }
}

module.exports = { REDIS_CONF, MYSQL_CONF }
