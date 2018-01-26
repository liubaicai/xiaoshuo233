
const schedule = require('node-schedule');

const request = require('request');
const cheerio = require('cheerio')

const start = function () {
    // '0 0 1 * * 2' 每周一凌晨一点
    schedule.scheduleJob('0 * * * * *', function(){
        request('https://www.qu.la/book/1', function (error, response, body) {
            if(response && response.statusCode==200){
                const $ = cheerio.load(escape2Html(body), {decodeEntities: false})
                var title = $('meta[property="og:title"]').prop('content');
                var description = $('meta[property="og:description"]').prop('content');
                var category = $('meta[property="og:novel:category"]').prop('content');
                var author = $('meta[property="og:novel:author"]').prop('content');
                var status = $('meta[property="og:novel:status"]').prop('content'); // 连载,完成
                console.log(title);
                console.log(description);
                console.log(category);
                console.log(author);
                console.log(status);
            }
            // var node = $(escape2Html(body)).find("div#content");

            // console.log('error:', error); // Print the error if one occurred
            // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            // console.log('body:', body); // Print the HTML for the Google homepage.
        });
    });
}

function escape2Html(str) {
    var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}

module.exports.start = start;