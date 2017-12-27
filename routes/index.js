var express = require('express');
var router = express.Router();
var models = require('../models/models');
var pinyin = require('pinyin');
var pagination = require('pagination');

/* GET home page. */
router.get('/', function(req, res, next) {
    var promises = new Array()
    var config = {}

    var recommend = models.book.findAll({
        order: [ [ 'views', 'DESC' ] ],
        include: [models.category],
        limit: 6
    }).then(function (books) {
        config.books_recommend = books
    });

    var hot = models.book.findAll({
        order: [ [ 'views', 'DESC' ] ],
        include: [models.category],
        limit: 10
    }).then(function (books) {
        config.books_hot = books
    });

    var cates = models.category.findAll({
        include: [{
            model: models.book,
            limit: 10,
            order: [[ 'views', 'DESC' ]],
        }],
    }).then(function (categories) {
        config.categories = categories
    });
    promises.push(recommend);
    promises.push(hot);
    promises.push(cates);
    Promise.all(promises)
        .then(function(results){
            console.log(results)
            res.render('index', {
                pinyin: pinyin,
                books_recommend: config.books_recommend,
                books_hot: config.books_hot,
                categories: config.categories,
            });
        });
});

router.get('/books-all.html', function(req, res, next) {
    var pagesize = 100;
    var page = req.query.page;
    if (page){}else{
        page = 1
    }
    models.book.findAndCountAll({
        order: [ [ 'views', 'DESC' ] ],
        limit: pagesize,
        offset: (page - 1) * pagesize
    }).then(function (books) {
        var paginator = new pagination.TemplatePaginator({
            current: page,
            rowsPerPage: pagesize,
            totalResult: books.count,
            template: function(result) {
                var i, len, prelink;
                var html = '<div><ul class="pagination">';
                if(result.pageCount < 2) {
                    html += '</ul></div>';
                    return html;
                }
                prelink = this.preparePreLink(result.prelink);
                if(result.previous) {
                    html += '<li><a href="' + prelink + result.previous + '">' + '上一页' + '</a></li>';
                }
                if(result.range.length) {
                    for( i = 0, len = result.range.length; i < len; i++) {
                        if(result.range[i] === result.current) {
                            html += '<li class="active"><a href="' + prelink + result.range[i] + '">' + result.range[i] + '</a></li>';
                        } else {
                            html += '<li><a href="' + prelink + result.range[i] + '">' + result.range[i] + '</a></li>';
                        }
                    }
                }
                if(result.next) {
                    html += '<li><a href="' + prelink + result.next + '" class="paginator-next">' + '下一页' + '</a></li>';
                }
                html += '</ul></div>';
                return html;
            }
        });
        res.render('books', {
            title: '所有小说',
            books: books.rows,
            paginator: paginator
        });
    });
});

router.get('/books-category.html', function(req, res, next) {
    var pagesize = 100;
    var page = req.query.page;
    if (page){}else{
        page = 1
    }
    var t = req.query.t;
    if (t){}else{
        t = '武侠仙侠'
    }
    models.category.findOne({where: {'title': t}}).then(function (category) {
        models.book.findAndCountAll({
            where: { 'category_id': category.id },
            order: [ [ 'views', 'DESC' ] ],
            limit: pagesize,
            offset: (page - 1) * pagesize
        }).then(function (books) {
            var paginator = new pagination.TemplatePaginator({
                current: page,
                rowsPerPage: pagesize,
                totalResult: books.count,
                template: function(result) {
                    var i, len, prelink;
                    var html = '<div><ul class="pagination">';
                    if(result.pageCount < 2) {
                        html += '</ul></div>';
                        return html;
                    }
                    prelink = this.preparePreLink(result.prelink);
                    if(result.previous) {
                        html += '<li><a href="' + prelink + result.previous + '">' + '上一页' + '</a></li>';
                    }
                    if(result.range.length) {
                        for( i = 0, len = result.range.length; i < len; i++) {
                            if(result.range[i] === result.current) {
                                html += '<li class="active"><a href="' + prelink + result.range[i] + '">' + result.range[i] + '</a></li>';
                            } else {
                                html += '<li><a href="' + prelink + result.range[i] + '">' + result.range[i] + '</a></li>';
                            }
                        }
                    }
                    if(result.next) {
                        html += '<li><a href="' + prelink + result.next + '" class="paginator-next">' + '下一页' + '</a></li>';
                    }
                    html += '</ul></div>';
                    return html;
                }
            });
            res.render('books', {
                title: '所有小说',
                books: books.rows,
                paginator: paginator
            });
        });
    });
});

router.get('/search.html', function(req, res, next) {
    var key = req.query.key;
    if (key){

    }else {

    }
});

module.exports = router;
