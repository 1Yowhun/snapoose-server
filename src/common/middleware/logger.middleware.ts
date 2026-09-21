import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLogger } from '../logger.service.js';

@Injectable()
export class logMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}
  use(req: Request, res: Response, next: NextFunction) {
    this.logger.info(`Receive request for URL: ${req.url} from IP:${req.ip}`);
    next();
  }
}
