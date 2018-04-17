var express = require('express');
var router = express.Router();
var models = require('../models/models');
var request = require('request');
const cheerio = require('cheerio');

router.get('/:id.html', function(req, res, next) {
    models.book.findById(req.params.id, {
        include: [{
            model: models.catalog,
        }],
        order: [
            [
                { model: models.catalog }, 'catalog_id'
            ],
            [
                { model: models.catalog }, 'id'
            ]
        ],
    }).then(function (book) {
        book.views = book.views+1;
        book.save();
        res.render('book', {
            book: book,
        });
    });
});

router.get('/:id/:cid.html', function(req, res, next) {
    models.catalog.findOne({
        where: {
            'book_id': req.params.id,
            'id': req.params.cid,
        },
        include: [{
            model: models.book,
            include:[{ model: models.category }]
        }],
        order: [
            [ 'catalog_id' ]
        ],
    }).then(function (catalog) {
        catalog.book.views = catalog.book.views+1;
        catalog.book.save();
        var prev_catalog;
        var next_catalog;
        var max = models.catalog.max('id',{ where: {
                book_id: { [models.op.eq]: catalog.book_id },
                id: { [models.op.lt]: catalog.id }
            }
        }).then(max => {
            prev_catalog = max;
        })
        var min = models.catalog.min('id', { where: {
                book_id: { [models.op.eq]: catalog.book_id },
                id: { [models.op.gt]: catalog.id }
            }
        }).then(min => {
            next_catalog = min;
        })
        Promise.all([max,min])
            .then(function(results){
                res.render('detail', {
                    catalog: catalog,
                    content: catalog.text,
                    prev_catalog: prev_catalog,
                    next_catalog: next_catalog,
                });
                // request(catalog.src, function (error, response, body) {
                //     const $ = cheerio.load(escape2Html(body), {decodeEntities: false});
                //     var node = $("div#content");
                //     var content = node.html().replace(/<br>　　<br>/g, '<br>');
                //     if(content.indexOf("本站重要通知") > 0){
                //         content = content.substring(0, content.indexOf('本站重要通知'));
                //     }
                //     if(content.indexOf("请关注微信") > 0){
                //         content = content.substring(0, content.indexOf('请关注微信'));
                //     }
                //
                //     res.render('detail', {
                //         catalog: catalog,
                //         content: content,
                //         prev_catalog: prev_catalog,
                //         next_catalog: next_catalog,
                //     });
                // });
            });
    });
});

function escape2Html(str) {
    var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}

module.exports = router;
