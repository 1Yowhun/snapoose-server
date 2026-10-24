import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLogger } from '../logger.service.js';

@Injectable()
export class logMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}
  use(req: Request, res: Response, next: NextFunction) {
    this.logger.debug(
      `Request received: method=${req.method} path=${req.path}`,
      logMiddleware.name,
    );
    next();
  }
}
