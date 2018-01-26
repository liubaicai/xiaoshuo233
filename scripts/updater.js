var schedule = require('node-schedule');

const start = function () {
    // '0 0 1 * * 2' 每周一凌晨一点
    schedule.scheduleJob('0 * * * * *', function(){
        console.log(new Date())
    });
}

module.exports.start = start;