var schedule = require('node-schedule');

var request = require('request');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);

const start = function () {
    // '0 0 1 * * 2' 每周一凌晨一点
    schedule.scheduleJob('0 * * * * *', function(){
        request('https://www.qu.la/book/1', function (error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
        });
    });
}

module.exports.start = start;