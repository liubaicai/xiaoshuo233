var epubParser = require('epub-parser');
var path = require('path');
var cheerio = require('cheerio')
const models = require('./models/models');

epubParser.open(process.argv.splice(2)[0], async function (err, epubData) {

    var bookTitle = getArrayContent(epubData.raw.json.ncx.docTitle);
    var bookAuthor = getArrayContent(epubData.raw.json.ncx.docAuthor);
    console.log(bookTitle);
    var book = await models.book.findOne({
        where: {
            title: bookTitle,
        }
    });
    console.log(book!=null)
    if (book==null){
        var categoryTitle = '其他';
        var category = await models.category.findOne({
            where: {
                title: categoryTitle,
            }
        });
        if (category==null){
            category = await models.category.create({ title: categoryTitle})
        }
        var newid = await models.book.max('id');
        if(newid > 1000000){
            newid = newid + 1;
        }else{
            newid = 1000001;
        }
        book = await models.book.create({
            id: newid,
            title: bookTitle,
            author: bookAuthor,
            description: '',
            category_id: category.id,
            close: 1,
            epub: 1,
            views: 0,
        })
    }
    else{
        book.epub = 1;
        await book.save();
    }
    await models.catalog.destroy({
        where: {
            book_id: book.id,
        }
    });
    var catalogsArray = new Array();
    var zip = epubParser.getZip();
    epubData.raw.json.ncx.navMap[0].navPoint.forEach(function(chapter){
        //console.log(chapter.navLabel[0].text[0]);
        if (chapter.navPoint){
            chapter.navPoint.forEach(function(article){
                //console.log(article.navLabel[0].text[0]);
                var cataTitle = article.navLabel[0].text[0];
                var xhtmlPath = path.join(epubData.paths.opsRoot, article.content[0].$.src);
                //console.log(xhtmlPath);
                var xhtml = zip.file(xhtmlPath).asText();
                var root = cheerio.load(xhtml,{decodeEntities: false})('body div')

                var arr = new Array();
                root.contents().each(function(i, elem) {
                    if(elem.name!='h2' && elem.name!='div' && elem.name!='img'){
                        var ppp = cheerio.load(elem,{decodeEntities: false}).html().trim()
                        if(ppp!=null && ppp!=''){
                            arr.push(ppp);
                        }
                    }
                  });
                var content = arr.join("\n");
                //console.log(content)
                catalogsArray.push({
                    book_id: book.id,
                    catalog_id: null,
                    title: cataTitle,
                    src: null,
                    text: content
                });
            });
        }
    });
    await models.catalog.bulkCreate(catalogsArray);
});

function getArrayContent(strArray){
    try {
        return strArray[0].text[0].trim();
    } catch (error) {
        return '';
    }
}