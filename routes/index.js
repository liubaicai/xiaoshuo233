var express = require('express');
var router = express.Router();
var models = require('../models/models');

/* GET home page. */
router.get('/', function(req, res, next) {
    models.book.findOne({include: [models.category]}).then(function (book) {
        res.render('index', {
            title: book.category.title,
        });
    });
});

module.exports = router;
