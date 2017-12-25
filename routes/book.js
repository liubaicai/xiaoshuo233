var express = require('express');
var router = express.Router();
var models = require('../models/models');

/* GET users listing. */
router.get('/:id.html', function(req, res, next) {
    models.book.findById(req.params.id, {
        include: [{
            model: models.catalog,
        }],
        order: [
            [ { model: models.catalog }, 'catalog_id' ]
        ],
    }).then(function (book) {
        res.render('book', {
            book: book,
        });
    });
});

module.exports = router;
