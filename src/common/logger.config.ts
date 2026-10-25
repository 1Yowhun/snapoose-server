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
  ],
};
