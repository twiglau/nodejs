// insert ... 语句

const { Blog, User } = require('./model')

//! 号, 与前面代码隔离开来
!(async function() {
    const zhangsan = await User.create({
        userName:'zhangsan',
        password:'123',
        nickName:'张三'
    })
    //insert into users (...) values (...)
    console.log('zhangsan:',zhangsan.dataValues)
    const zhangsanid = zhangsan.dataValues.id
    
    const lisi = await User.create({
        userName:'lisi',
        password:'123',
        nickName:'李四'
    })
    const lisiid = lisi.dataValues.id

    //创建博客
    const blog1 = await Blog.create({
        title:'标题1',
        content:'内容1',
        userId:zhangsanid
    })
    const blog2 = await Blog.create({
        title:'标题2',
        content:'内容2',
        userId:zhangsanid
    })
    const blog3 = await Blog.create({
        title:'标题3',
        content:'内容3',
        userId:lisiid
    })
    const blog4 = await Blog.create({
        title:'标题4',
        content:'内容4',
        userId:lisiid
    })

})()