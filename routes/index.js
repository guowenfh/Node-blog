var crypto = require('crypto')
var User = require('../models/user.js')
var Post = require('../models/post.js')
var Comment = require('../models/comment.js')
var multer = require('multer')

module.exports = function(app) {
    // 文件上传功能
    var storage = multer.diskStorage({
        // destination 是上传的文件所在的目录
        destination: function(req, file, cb) {
            cb(null, './public/images')
        },
        // filename 函数用来修改上传后的文件名，这里设置为保持原来的文件名。
        filename: function(req, file, cb) {
            cb(null, file.originalname)
        }
    })
    var upload = multer({
        storage: storage
    })

    app.get('/', function(req, res) {
        // 判断是否是第一页，并把请求的页数转换成 number 类型
        var page = parseInt(req.query.p, 10) || 1
            // 查询并返回第 page 页的 10 篇文章
        Post.getTen(null, page, function(err, posts, total) {
            if (err) {
                posts = []
            }
            res.render('index', {
                title: '主页',
                posts: posts,
                page: page,
                isFirstPage: (page - 1) === 0,
                isLastPage: ((page - 1) * 10 + posts.length) === total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
    app.get('/reg', checkNotLogin)
    app.get('/reg', function(req, res) {
        res.render('reg', { title: '注册' })
    })

    app.post('/reg', checkNotLogin)
    app.post('/reg', function(req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat']
            // 检验用户两次输入的密码是否一致
        if (password_re !== password) {
            req.flash('error', '两次输入的密码不一致!')
            return res.redirect('/reg') // 返回注册页
        }
        // 生成密码的 md5 值
        var md5 = crypto.createHash('md5')
        password = md5.update(req.body.password).digest('hex')
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        })
            // 检查用户名是否已经存在
        User.get(newUser.name, function(err, user) {
            if (err) {
                req.flash('error', err)
                return res.redirect('/')
            }
            if (user) {
                req.flash('error', '用户已存在!')
                return res.redirect('/reg') // 返回注册页
            }
            // 如果不存在则新增用户
            newUser.save(function(err, user) {
                if (err) {
                    req.flash('error', err)
                    return res.redirect('/reg') // 注册失败返回主册页
                }
                req.session.user = newUser // 用户信息存入 session
                req.flash('success', '注册成功!')
                res.redirect('/') // 注册成功后返回主页
            })
        })
    })

    app.get('/login', checkNotLogin)
    app.get('/login', function(req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    })
    app.post('/login', checkNotLogin)
    app.post('/login', function(req, res) {
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex')
        User.get(req.body.name, function(err, user) {
            if (err) {
                req.flash('error', err)
                return res.redirect('/login')
            }
            if (!user) {
                req.flash('error', '用户不存在!')
                return res.redirect('/login')
            }
            if (user.password !== password) {
                req.flash('error', '密码错误!')
                return res.redirect('/login')
            }
            req.session.user = user
            req.flash('success', '登陆成功!')
            res.redirect('/')
        })
    })

    app.get('/post', checkLogin)
    app.get('/post', function(req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    })
    app.post('/post', checkLogin)
    app.post('/post', function(req, res) {
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
            post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post)
        post.save(function(err) {
            if (err) {
                req.flash('error', err)
                return res.redirect('/')
            }
            req.flash('success', '发布成功!')
            res.redirect('/') // 发表成功跳转到主页
        })
    })

    app.get('/logout', checkLogin)
    app.get('/logout', function(req, res) {
        req.session.user = null
        req.flash('success', '登出成功!')
        res.redirect('/') // 登出成功后跳转到主页
    })

    app.get('/upload', checkLogin)
    app.get('/upload', function(req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    })
    app.post('/upload', checkLogin)
    app.post('/upload', upload.array('field1', 5), function(req, res) {
        req.flash('success', '文件上传成功!')
        res.redirect('/upload')
    })
    app.get('/search', function(req, res) {
        Post.search(req.query.keyword, function(err, posts) {
            if (err) {
                req.flash('error', err)
                return res.redirect('/')
            }
            res.render('search', {
                title: 'SEARCH:' + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
    app.get('/links', function(req, res) {
        res.render('links', {
            title: '友情链接',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    })
    app.get('/u/:name', function(req, res) {
        var page = parseInt(req.query.p, 10) || 1
                // 检查用户是否存在
        User.get(req.params.name, function(err, user) {
            if (err) {
                req.flash('error', '用户不存在!')
                return res.redirect('/')
            }
            if (!user) {
                req.flash('error', '用户不存在!')
                return res.redirect('/')
            }
                // 查询并返回该用户第 page 页的 10 篇文章
            Post.getTen(user.name, page, function(err, posts, total) {
                if (err) {
                    req.flash('error', err)
                    return res.redirect('/')
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) === 0,
                    isLastPage: ((page - 1) * 10 + posts.length) === total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                })
            })
        })
    })
        // 文字归档页面
    app.get('/archive', function(req, res) {
        Post.getArchive(function(err, posts) {
            var lastYear = 0
            if (err) {
                req.flash('error', err)
                return res.redirect('/')
            }
                // 为了处理年份归档最简单粗暴的方法
            posts.forEach(function(item) {
                item.time.lastYear = ''
                if (item.time.year !== lastYear) {
                    lastYear = item.time.year
                    item.time.lastYear = lastYear
                }
            })
            res.render('archive', {
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
        // 标签页
    app.get('/tags', function(req, res) {
        Post.getTags(function(err, posts) {
            if (err) {
                req.flash('error', err)
                return res.redirect('/')
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
    app.get('/tags/:tag', function(req, res) {
        Post.getTag(req.params.tag, function(err, posts) {
            var lastYear = ''
            if (err) {
                req.flash('error', err)
                return res.redirect('/')
            }
            // 为了处理年份归档最简单粗暴的方法
            posts.forEach(function(item) {
                item.time.lastYear = ''
                if (item.time.year !== lastYear) {
                    lastYear = item.time.year
                    item.time.lastYear = lastYear
                }
            })
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
    app.get('/u/:name/:day/:title', function(req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('error', err)
                return res.redirect('/')
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
    app.get('/edit/:name/:day/:title', checkLogin)
    app.get('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user
        Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('error', err)
                return res.redirect('back')
            }
            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
    app.post('/edit/:name/:day/:title', checkLogin)
    app.post('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title)
            if (err) {
                req.flash('error', err)
                return res.redirect(url) // 出错！返回文章页
            }
            req.flash('success', '修改成功!')
            res.redirect(url) // 成功！返回文章页
        })
    })
    app.get('/remove/:name/:day/:title', checkLogin)
    app.get('/remove/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user
        Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
            if (err) {
                req.flash('error', err)
                return res.redirect('back')
            }
            req.flash('success', '删除成功!')
            res.redirect('/')
        })
    })
    app.post('/u/:name/:day/:title', function(req, res) {
        var date = new Date(),
            time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
            date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = 'http://www.gravatar.com/avatar/' + email_MD5 + '?s=48'
        var comment = {
            name: req.body.name,
            head: head,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        }
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment)
        newComment.save(function(err) {
            if (err) {
                req.flash('error', err)
                return res.redirect('back')
            }
            req.flash('success', '留言成功!')
            res.redirect('back')
        })
    })
    app.use(function(req, res) {
        res.render('404')
    })

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!')
            res.redirect('/login')
        }
        next()
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!')
            res.redirect('back')
        }
        next()
    }
}