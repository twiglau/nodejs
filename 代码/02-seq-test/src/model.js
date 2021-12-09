const Sequelize = require('sequelize');
const seq = require('./seq')

//创建 User 模型. 数据表的名字是 users
const User = seq.define('user',{
    // id 会自动创建,并设为主键,自增
    userName: {
        type:Sequelize.STRING, // 对应 - varchar(255)
        allowNUll:false
    },
    password: {
        type:Sequelize.STRING,
        allowNUll:false
    },
    nickName: {
        type:Sequelize.STRING
    }
    //自动创建: createdAt 和 updatedAt
})

//创建Blog模型
const Blog = seq.define('blog',{
    title: {
        type:Sequelize.STRING,
        allowNUll:false
    },
    content: {
        type:Sequelize.TEXT,
        allowNUll:false
    },
    userId: {
        type:Sequelize.INTEGER,
        allowNUll:false
    }
})

//外键关联
Blog.belongsTo(User,{
    // 创建外键 Blog.userId -> User.id
    foreignKey:'userId'
})
//1. Blog.belongsTo(User),需要把Blog中userId删除掉
User.hasMany(Blog,{
    foreignKey:'userId'
})

module.exports = {
    User,
    Blog
}