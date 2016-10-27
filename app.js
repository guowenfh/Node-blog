//  模块加载
var express = require('express');
var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var template = require('art-template');
// 引入session管理
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);


var routes = require('./routes/index');
var settings = require('./settings');

var flash = require('connect-flash');
// 生成一个express实例 app。
var app = express();
app.set('port', process.env.PORT || 3000); // 设置端口号
// 设置 views 文件夹为存放视图文件的目录
app.set('views', path.join(__dirname, 'views'));
// 使用art-template 的设置
template.config('base', '');
template.config('extname', '.html');
app.engine('.html', template.__express);
app.set('view engine', 'html');

app.use(flash());
// favicon.ico存放位置
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// 加载日志中间件。
app.use(logger('dev'));
// 加载解析json的中间件。
app.use(bodyParser.json());
// 加载解析urlencoded请求体的中间件。
app.use(bodyParser.urlencoded({ extended: true }));
// 加载解析cookie的中间件。
app.use(cookieParser());
// 设置public文件夹为存放静态文件的目录。
app.use(express.static(path.join(__dirname, 'public')));
// 路由控制器。
// app.use('/', routes);
// app.use('/users', users);

app.use(session({
    secret: settings.cookieSecret,
    key: settings.db, // cookie name
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }, // 30 days
    store: new MongoStore({
        url: 'mongodb://localhost/blog',
    }),
}));


routes(app);


// 捕获404错误，并转发到错误处理器。
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// 开发环境下的错误处理器，将错误信息渲染error模版并显示到浏览器中。
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
        });
    });
}

// 生产环境下的错误处理器，不会将错误信息泄露给用户。
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
    });
});
app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
// 导出app实例供其他模块调用。
module.exports = app;