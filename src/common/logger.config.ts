import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          const ctx = context ? ` [${context}]` : '';
          return `${timestamp} ${level}${ctx}: ${message}`;
        }),
      ),
    }),

    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: logLevel,
      maxFiles: '14d',
      maxSize: '100m',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      maxSize: '100m',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
