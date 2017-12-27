var express = require('express');
var router = express.Router();
var models = require('../models/models');
var request = require('request');
const Sequelize = require('sequelize');
const Op = Sequelize.Op

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);

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
                    var node = $(escape2Html(body)).find("div#content");
                    var content = node.html().replace(/<br>　　<br>/g, '<br>');
                    if(content.indexOf("本站重要通知") > 0){
                        content = content.substring(0, content.indexOf('本站重要通知'));
                    }
                    if(content.indexOf("请关注微信") > 0){
                        content = content.substring(0, content.indexOf('请关注微信'));
                    }
                    res.render('detail', {
                        catalog: catalog,
                        content: content,
                        prev_catalog: prev_catalog,
                        next_catalog: next_catalog,
                    });
                });
            });
    });
});

function escape2Html(str) {
    var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}

module.exports = router;
