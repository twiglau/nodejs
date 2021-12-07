# 建表

```
use koa2_weibo_db
```
## 注释用 --
```
-- select * from users;

select username,nickname from users where username='zhangsan' and `password`='123456';

insert into blogs (title,content,userid) values('标题1','内容1',2);

update blogs set content='呢绒1内容1' where id='1';

delete from blogs where id=3;
```
