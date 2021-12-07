## 建表

```
use koa2_weibo_db
```
## 注释用 --
```
-- select * from users;
```
## 基本sql语句
```
//查询
select username,nickname from users where username='zhangsan' and `password`='123456';

//插入
insert into blogs (title,content,userid) values('标题1','内容1',2);

//更新
update blogs set content='呢绒1内容1' where id='1';

//删除
delete from blogs where id=3;

//查询总数
select count(id) as `count` from blogs;

//查询列
select * from blogs order by id desc limit 2 offset 2;
```

## 外键
* 创建外键
* 更新限制 & 删除级联
* 连表查询
### 如何创建外键
> 1. Alter table
> 2. Foreign Keys
> 3. On update: CASCADE  On Delete: CASCADE 更新,删除级联
> 4. 注释 Comment:

