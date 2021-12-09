const {Blog,User } = require('./model')

!(async function(){

    // 查询一条记录
    // const zhangsan = await User.findOne({
    //     where: {
    //         userName:'zhangsan'
    //     }
    // })
    // console.log('zhangsan',zhangsan.dataValues)

    // 查询特定的列
    // const zhangsanName = await User.findOne({
    //     attributes: ['userName','nickName'],
    //     where:{
    //         userName:'zhangsan'
    //     }
    // })
    // console.log('zhangsanName',zhangsanName.dataValues)

    // 查询一个列表
    // const zhangsanBlogList = await Blog.findAll({
    //     where: {
    //         userId: 1
    //     },
    //     order: [
    //         ['id','desc']
    //     ]
    // })
    // console.log(
    //     'zhangsanBlogList',
    //     zhangsanBlogList.map(blog => blog.dataValues)
    // )

    // 分页
    // const blogPageList = await Blog.findAll({
    //     limit:2, //限制本次查询 2 条
    //     offset:0, //跳过多少条
    //     order: [
    //         ['id','desc']
    //     ]
    // })
    // console.log(
    //     'blogPageList',
    //     blogPageList.map(blog => blog.dataValues)
    // )

    // 查询总数
    // const blogListAndCount = await Blog.findAndCountAll({
    //     limit:2,
    //     offset: 0, 
    //     order: [
    //         ['id','desc']
    //     ]
    // })
    // console.log(
    //     'blogListAndCount',
    //     blogListAndCount.count, //所有的总数, 不考虑分页
    //     blogListAndCount.rows.map(blog => blog.dataValues)
    // )

    // 连表查询1
    // const blogListWithUser = await Blog.findAndCountAll({
    //     order:[
    //         ['id','desc']
    //     ],
    //     include: [
    //         {
    //             model:User,
    //             attributes: ['userName','nickName'],
    //             where: {
    //                 userName:'zhangsan'
    //             }
    //         }
    //     ]
    // })
    // console.log(
    //     'blogListWithUser',
    //     blogListWithUser.count,
    //     blogListWithUser.rows.map(blog => {
    //         const blogVal = blog.dataValues
    //         blogVal.user = blogVal.user.dataValues
    //         return blogVal
    //     })
    // )

    // 连表查询2
    const userListWithBlog = await User.findAndCountAll({
        attributes: ['userName','nickName'],
        include: [
            {model:Blog}
        ]
    })
    console.log(
        'userListWithBlog',
        userListWithBlog.count,
        userListWithBlog.rows.map(user => {
            const userVal = user.dataValues
            userVal.blogs = userVal.blogs.map(blog => blog.dataValues)
            return userVal
        })
    )
})()