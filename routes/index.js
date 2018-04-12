var express = require('express');
var router = express.Router();
var models = require('../models/models');
var pinyin = require('pinyin');
var pagination = require('pagination');

/* GET home page. */
router.get('/', async function(req, res, next) {

    var books_recommend = await models.book.findAll({
        where: { 'epub' : 1 },
        order: [ [ 'views', 'DESC' ] ],
        include: [models.category],
        limit: 6
    });

    var books_hot = await models.book.findAll({
        where: { 'epub' : 1 },
        order: [ [ 'views', 'DESC' ] ],
        include: [models.category],
        limit: 10
    });

    var categories = new Array();
    var cates = await models.category.findAll();
    for (var i = 0; i < cates.length; i++){
        var category = cates[i];
        var books = await models.book.findAll({
            where: { 'epub' : 1 , category_id : cates[i].dataValues.id },
            order: [ [ 'views', 'DESC' ] ],
            include: [models.category],
            limit: 10
        });
        if(books.length>0){
            category.books = books;
            categories.push(category);
        }
    }

    res.render('index', {
        pinyin: pinyin,
        books_recommend: books_recommend,
        books_hot: books_hot,
        categories: categories,
    });
});

router.get('/update.json', function (req, res) {
    var sql = 'SELECT A.*,b.book_id,b.ID AS id,C.title AS category_title FROM books A INNER JOIN (SELECT book_id,MAX (ID) AS ID FROM catalogs GROUP BY book_id ORDER BY ID DESC LIMIT 10) b ON A.ID=b.book_id INNER JOIN categories C ON A.category_id=C.ID ORDER BY id DESC';
    models.seq.query(sql, { type: models.seq.QueryTypes.SELECT})
        .then(books => {
            res.json(books);
        })
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
        models.book.findAndCountAll({
            where: {
                title: {
                    [models.op.like]: "%"+key+"%"
                }
            },
            order: [ [ 'views', 'DESC' ] ],
        }).then(function (books) {
            res.render('books', {
                title: '所有小说',
                books: books.rows,
                paginator: null
            });
        });
    }else {
        res.redirect('/books-all.html');
    }
});

module.exports = router;
