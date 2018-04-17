
const schedule = require('node-schedule');

const request = require('request-promise');
const retryRequest = require('../modules/request-promise-retry');
const cheerio = require('cheerio');
const models = require('../models/models');
const lzs = require('lz-string');

const logger = require('../modules/logger')('updater');

const startList = async function () {
    for (var i = 1;i <= 80000;i++){
        try
        {
            var book = await models.book.findById(i);
            if (book==null){
                var uri = `https://www.qu.la/book/${i}/`;
                var response = await retryRequest({
                    method: 'GET',
                    uri: uri,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
                    },
                    timeout: 30000,
                    retry : 10,
                    resolveWithFullResponse: true});
                if (response && response.statusCode==200){
                    var txt = response.body;
                    if(txt.indexOf("window.location.href=")>0){
                        logger.info(txt)
                    }else {
                        const $ = cheerio.load(escape2Html(txt), {decodeEntities: false});
                        var title = $('meta[property="og:title"]').prop('content');
                        if (title==null){
                            continue;
                        }
                        var description = $('meta[property="og:description"]').prop('content');
                        var categoryTitle = $('meta[property="og:novel:category"]').prop('content');
                        var author = $('meta[property="og:novel:author"]').prop('content');
                        var status = $('meta[property="og:novel:status"]').prop('content'); // 连载,完成
                        if (categoryTitle==null){
                            categoryTitle = '其他';
                        }
                        var category = await models.category.findOne({
                            where: {
                                title: categoryTitle,
                            }
                        });
                        if (category==null){
                            category = await models.category.create({ title: categoryTitle})
                        }
                        book = await models.book.create({
                            id: i,
                            title: title,
                            author: author,
                            description: description,
                            category_id: category.id,
                            close: status=='完成'?1:0,
                            epub: 0,
                            views: 0,
                        })
                    }
                }else {
                    logger.error(uri);
                    logger.error(response.statusCode);
                }
            }
        }
        catch(err)
        {
            logger.error(uri);
            logger.error(err);
        }
    }
}

const startContent = async function () {
    var books = await models.book.findAll({
        where: {
            'epub':{
                [models.op.or]: [
                    {[models.op.is]: null},
                    {[models.op.not]: 1},
                ]
            }
        }
    });
    var len = books.length;
    for(var i=0;i<len;i++){
        var book = books[i];
        if (book!=null){
            logger.info(`${book.title}`)
            var uri = `https://m.qu.la/booklist/${book.id}.html`;
            var response = await retryRequest({
                method: 'GET',
                uri: uri,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
                },
                timeout: 30000,
                retry : 10,
                resolveWithFullResponse: true});
            if (response && response.statusCode==200){
                var txt = response.body;
                if(txt.indexOf("window.location.href=")>0){
                    logger.info(txt)
                }else {
                    const $ = cheerio.load(escape2Html(txt), {decodeEntities: false});

                    var hrefArray = new Array();
                    $('#chapterlist p a').each(function(i, elem) {
                        var at = $(this).text();
                        var al = $(this).prop('href');
                        if(al.indexOf("/book/") != -1){
                            hrefArray.push([at,al])
                        }
                    });

                    var hrefArrays = new Array();
                    var hrefArraysTemp = new Array();
                    for(var j=0;j<hrefArray.length;j++){
                        hrefArraysTemp.push(hrefArray[j])
                        if(hrefArraysTemp.length>=10){
                            hrefArrays.push(hrefArraysTemp)
                            hrefArraysTemp = new Array();
                        }
                    }

                    var catalogsArray = new Array();
                    for(var j=0;j<hrefArrays.length;j++){

                        var promises = new Array();

                        for(var k=0;k<hrefArrays[j].length;k++){

                            try{
                                logger.info(`${hrefArrays[j][k][0]}`)
                                var promise = retryRequest({
                                    method: 'GET',
                                    uri: `https://www.qu.la${hrefArrays[j][k][1]}`,
                                    headers: {
                                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
                                    },
                                    querystring:hrefArrays[j][k][0],
                                    timeout: 30000,
                                    retry : 10,
                                    resolveWithFullResponse: true
                                }).then(function (ar) {
                                    if (ar && ar.statusCode==200){
                                        var a$ = cheerio.load(escape2Html(ar.body), {decodeEntities: false});
                                        a$('div#content script').remove();
                                        var content = a$('div#content').html();
                                        var ccid = ar.request.uri.path.split('/')[3].split('.')[0]
                                        catalogsArray.push({
                                            book_id: book.id,
                                            catalog_id: ccid,
                                            title: ar.request.querystring,
                                            src: null,
                                            text: content
                                        });
                                    }
                                });
                                promises.push(promise)
                            }catch (err){
                                logger.error(err)
                            }
                        }

                        await Promise.all(promises);
                    }
                    await models.catalog.destroy({
                        where: {
                            book_id: book.id,
                        }
                    });
                    await models.catalog.bulkCreate(catalogsArray);
                    book.epub = 1;
                    await book.save();
                }
            }else {
                logger.error(uri);
                logger.error(response.statusCode);
            }
        }
    }
}

const scheduleJob = function () {
    // '0 0 1 * * 2' 每周一凌晨一点
    schedule.scheduleJob('0 * * * * *', async () => {

    });
}

function escape2Html(str) {
    var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}

module.exports.scheduleJob = scheduleJob;
module.exports.startList = startList;
module.exports.startContent = startContent;