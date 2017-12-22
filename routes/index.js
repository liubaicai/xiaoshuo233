var express = require('express');
var router = express.Router();
var models = require('../models/models');

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
            order: [ [ 'views', 'DESC' ] ],
            limit: 10
        }]}).then(function (categories) {
        config.categories = categories
    });
    promises.push(recommend);
    promises.push(hot);
    promises.push(cates);
    Promise.all(promises)
        .then(function(results){
            console.log(results)
            res.render('index', {
                books_recommend: config.books_recommend,
                books_hot: config.books_hot,
                categories: config.categories,
            });
        });
});

module.exports = router;
