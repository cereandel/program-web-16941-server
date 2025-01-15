const env = require("./enviroment");
const winston = require("winston");

const winstonLogger = winston.createLogger({
    format: winston.format.combine(
        winston.format.simple(),
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.colorize({ all: true }),
        winston.format.printf(info => `[${info.timestamp}] - ${info.level} - ${info.message}`)
    ),
    transports: [
        new winston.transports.Console({
            level: env.LOGGER_LEVEL,
        })
    ]
});

winstonLogger.stream = {
    write: function(message, encoding){
        winstonLogger.info(message.slice(0, -1));
    },
};

module.exports = winstonLogger