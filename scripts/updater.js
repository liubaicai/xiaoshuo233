
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
                    timeout: 120000,
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
    var books = await models.book.findAll();
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
                timeout: 300000,
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

                    var catalogsArray = new Array();
                    for(var j=0;j<hrefArray.length;j++){
                        try{
                            logger.info(`${hrefArray[j][0]}`)
                            var ar = await retryRequest({
                                method: 'GET',
                                uri: `https://www.qu.la${hrefArray[j][1]}`,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
                                },
                                timeout: 600000,
                                retry : 10,
                                resolveWithFullResponse: true});
                            if (ar && ar.statusCode==200){
                                var a$ = cheerio.load(escape2Html(ar.body), {decodeEntities: false});
                                a$('div#content script').remove();
                                var content = a$('div#content').html();
                                catalogsArray.push({
                                    book_id: book.id,
                                    catalog_id: null,
                                    title: hrefArray[j][0],
                                    src: null,
                                    text: content
                                });
                            }
                        }catch (err){
                            logger.error(err)
                        }
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