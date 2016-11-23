# Node-blog
使用 Express + MongoDB 搭建多人博客 ，学习Node.js

学习参考 ：[N-blog](https://github.com/nswbmw/N-blog) 这个仓库的示例代码

配套教程 [wiki](https://github.com/nswbmw/N-blog/wiki/_pages)

1. 更换模板引擎为 `art-template`

```
{{include 'footer'}}
```
在引入其余模块html文件时，最后不能有空格，会直接报错。。

```sh
./mongod --dbpath ../blog/ #在mongodb/bin目录下启动链接数据库
supervisor app.js #自动重启服务
```
