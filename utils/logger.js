const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, printf, errors, colorize } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const dailyRotateTransport = new transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level,
});

const logger = createLogger({
  level,
  format: combine(
    timestamp(),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    dailyRotateTransport,
    new transports.Console({
      format: combine(colorize(), timestamp(), errors({ stack: true }), logFormat),
    }),
  ],
  exitOnError: false,
});

// Stream for morgan compatibility (if you keep morgan)
logger.stream = {
  write: (message) => {
    // morgan adds a newline at the end of messages
    logger.info(message.trim());
  },
};

module.exports = logger;
