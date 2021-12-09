
const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const session = require('koa-generic-session')
const redisStore = require('koa-redis')
const path = require('path')
const { REDIS_CONF } = require('./config/db')
const { isProd } = require('./utils/env')
const { SESSION_SECRET_KEY } = require('./config/secretKeys')
const koaStatic = require('koa-static')

const errorViewRouter = require('./routes/view/error')
// error handler
let onErrorConfig = {}
if (isProd) {//如果是线上环境出错了,跳转到错误也
  onErrorConfig.redirect = '/error'
}
onerror(app, onErrorConfig)

// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text']
  })
)
app.use(json())
app.use(logger())
app.use(koaStatic(__dirname + '/public'))

app.use(
  views(__dirname + '/views', {
    extension: 'ejs'
  })
)
// session配置（加密密匙）
app.keys = SESSION_SECRET_KEY
app.use(
  session({
    // cookie的name 默认是 koa.sid
    key: 'weibo.sid',
    // redis key 的前缀 默认是 koa.sess
    prefix: 'weibo:sess:',
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    },
    store: redisStore({
      all: `${REDIS_CONF.host}:${REDIS_CONF.port}`
    })
  })
)

// routes
//404路由一定注册在最后,(放在最后)
app.use(errorViewRouter.routes(),errorViewRouter.allowedMethods())
// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

module.exports = app
