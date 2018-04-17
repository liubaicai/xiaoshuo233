'use strict';
const Winston = require('winston');

const logger = scope => {
    return new Winston.Logger({
        transports: [
            new (Winston.transports.Console)({
                timestamp: true,
                colorize: true,
                label: scope,
                prettyPrint: true,
                level: 'info',
            }),
            new (Winston.transports.File)({
                handleExceptions: true,
                humanReadableUnhandledException: true,
                filename: `./log/${scope}.log`,
                level: 'error',
            })
        ]
    });
};

module.exports = logger;