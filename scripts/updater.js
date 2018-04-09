
const schedule = require('node-schedule');

const request = require('request-promise');
const cheerio = require('cheerio');
const models = require('../models/models');
const lzs = require('lz-string');


const log4js = require('log4js');
log4js.configure({
    appenders: { error: { type: 'file', filename: './log/error.log' } },
    categories: { default: { appenders: ['error'], level: 'error' } }
});
const logger = log4js.getLogger('error');

const start = async function () {
    for (var i = 1;i <= 80000;i++){
        try
        {
            var book = await models.book.findById(i);
            if (book==null){
                var uri = `https://www.qu.la/book/${i}/`;
                var response = await request({
                    method: 'GET',
                    uri: uri,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
                    },
                    resolveWithFullResponse: true});
                if (response && response.statusCode==200){
                    var txt = response.body;
                    if(txt.indexOf("window.location.href=")>0){
                        console.log(txt)
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
                            views: 0,
                        })

                        // if(status=="完成"){
                        //     var category = await models.category.findOne({
                        //         where: {
                        //             title: categoryTitle
                        //         }
                        //     });
                        //     if (category==null){
                        //         category = await models.category.create({ title: categoryTitle})
                        //     }
                        //     var alist = new Array();
                        //     $('dl dd a').each(function(i, elem) {
                        //         var at = $(this).text();
                        //         var al = $(this).prop('href');
                        //         alist.push([at,al])
                        //     });
                        //     var ar = await request({
                        //         method: 'GET',
                        //         uri: `https://www.qu.la${alist[0][1]}`,
                        //         resolveWithFullResponse: true});
                        //     if (ar && ar.statusCode==200){
                        //         var a$ = cheerio.load(escape2Html(ar.body), {decodeEntities: false});
                        //         a$('div#content script').remove();
                        //         var content = a$('div#content').html();
                        //         console.log(lzs.decompress(lzs.compress(content)));
                        //     }
                        //     return false;
                        // }
                    }
                }else {
                    console.log(response);
                    logger.error(uri);
                    logger.error(response.statusCode);
                }
            }
        }
        catch(err)
        {
            console.log(err);
            logger.error(uri);
            logger.error(err.message);
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
module.exports.start = start;