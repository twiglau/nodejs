const { User } = require('./model')

!(async function(){
    const updateRes = await User.update({
        nickName:'张三1'
    },{
        where: {
            userName: 'zhangsan'
        }
    })
    console.log('updateRes...',updateRes[0] > 0)

})()