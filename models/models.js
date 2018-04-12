const Sequelize = require('sequelize');
const Op = require('sequelize').Op
const operatorsAliases = {}
// const seq = new Sequelize('postgres://dbbook:123456@127.0.0.1:5432/xiaoshuo', { operatorsAliases });

const log4js = require('log4js');
log4js.configure({
    appenders: { sql: { type: 'file', filename: './log/sql.log' } },
    categories: { default: { appenders: ['sql'], level: 'info' } }
});
const logger = log4js.getLogger('sql');

const seq = new Sequelize('sqlite://db/db.sqlite', {
    operatorsAliases,
    logging: function(sql) {
        logger.info(sql);
    }
});

const category = seq.define('categories', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    timestamps: false
});
const book = seq.define('books', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: true
    },
    author: {
        type: Sequelize.STRING,
        allowNull: true
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    close: {
        type: Sequelize.INTEGER,
        default: 0,
        allowNull: true
    },
    epub: {
        type: Sequelize.INTEGER,
        default: 0,
        allowNull: true
    },
    views: {
        type: Sequelize.INTEGER,
        default: 0,
        allowNull: true
    }
}, {
    timestamps: false
});
const catalog = seq.define('catalogs', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    book_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    catalog_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: true
    },
    src: {
        type: Sequelize.STRING,
        allowNull: true
    },
    text: {
        type: Sequelize.TEXT,
        allowNull: true
    }
}, {
    timestamps: false
});

category.hasMany(book, {foreignKey: 'category_id'});
book.hasMany(catalog, {foreignKey: 'book_id'});
catalog.belongsTo(book, {foreignKey: 'book_id'});
book.belongsTo(category, {foreignKey: 'category_id'});

category.sync();
book.sync();
catalog.sync();

module.exports = {};
module.exports.category = category
module.exports.book = book
module.exports.catalog = catalog
module.exports.seq = seq
module.exports.op = Op