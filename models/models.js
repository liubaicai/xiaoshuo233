const Sequelize = require('sequelize');
const operatorsAliases = {}
const seq = new Sequelize('postgres://dbbook:123456@127.0.0.1:5432/xiaoshuo', { operatorsAliases });

const category = seq.define('categories', {
    id: {
        type: Sequelize.INTEGER,
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
        primaryKey: true
    },
    close: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    views: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
}, {
    timestamps: false
});
const catalog = seq.define('catalogs', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    book_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
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
    }
}, {
    timestamps: false
});

category.hasMany(book, {foreignKey: 'category_id'});
book.hasMany(catalog, {foreignKey: 'book_id'});
catalog.belongsTo(book, {foreignKey: 'book_id'});
book.belongsTo(category, {foreignKey: 'category_id'});

module.exports = {category:category, book:book, catalog:catalog};