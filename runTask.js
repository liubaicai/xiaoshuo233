
const request = require('request-promise');
var ppp = '123';
var promise = request({
    method: 'GET',
    querystring:ppp,
    resolveWithFullResponse: true,
    uri: `http://www.jb51.net/article/50170.htm`
}).then(function (ar) {
    console.log(ar.request.querystring)
});