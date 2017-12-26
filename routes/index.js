var express = require('express');
var router = express.Router();
var models = require('../models/models');
var pinyin = require('pinyin');

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
    models.book.findAll().then(function (books) {
        res.render('all', {
            books: books
        });
    });
});

module.exports = router;
