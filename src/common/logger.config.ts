// src/common/logger.config.ts
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const fileFilter = winston.format((info) => {
  const allowedContexts = [
    'AuthService',
    'AuthController',
    'UserService',
    'UserController',
  ];

  if (allowedContexts.includes(info.context as string)) {
    return info;
  }

  return false;
});
export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          const ctx = context ? ` [${context}]` : '';
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
    }),

    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      maxFiles: '14d',
      maxSize: '100m',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        fileFilter(),
      ),
    }),
  ],
};
