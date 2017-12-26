var express = require('express');
var router = express.Router();
var models = require('../models/models');
var request = require('request');
const Sequelize = require('sequelize');
const Op = Sequelize.Op

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

router.get('/:id/:cid.html', function(req, res, next) {
    models.catalog.findOne({
        where: {
            'catalog_id': req.params.cid,
        },
        include: [{
            model: models.book,
            include:[{ model: models.category }]
        }],
        order: [
            [ 'catalog_id' ]
        ],
    }).then(function (catalog) {
        var prev_catalog;
        var next_catalog;
        var max = models.catalog.max('catalog_id',{ where: {
                book_id: { [Op.eq]: catalog.book_id },
                catalog_id: { [Op.lt]: catalog.catalog_id }
            }
        }).then(max => {
            prev_catalog = max;
        })
        var min = models.catalog.min('catalog_id', { where: {
                book_id: { [Op.eq]: catalog.book_id },
                catalog_id: { [Op.gt]: catalog.catalog_id }
            }
        }).then(min => {
            next_catalog = min;
        })
        Promise.all([max,min])
            .then(function(results){
                request(catalog.src, function (error, response, body) {
                    res.render('detail', {
                        catalog: catalog,
                        content: body,
                        prev_catalog: prev_catalog,
                        next_catalog: next_catalog,
                    });
                });
            });
    });
});

module.exports = router;
