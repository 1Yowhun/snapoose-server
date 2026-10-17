import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { AppLogger } from '../logger.service.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json(exception.getResponse());
    }

    const cause = exception?.cause ?? exception;

    this.logger.logError(
      `Unhandled request error: method=${req.method} path=${req.path}`,
      exception,
      'AllExceptionsFilter',
    );

    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      ...(isDev && { detail: cause?.message, code: cause?.code }),
    });
  }
}
