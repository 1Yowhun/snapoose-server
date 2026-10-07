import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppLogger } from './common/logger.service.js';
import { Public } from './common/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: AppLogger,
  ) {}

  @Public()
  @Get('/test')
  async getHello() {
    return `hello world`;
  }

  @Get('/private')
  async getPrivate() {
    return `hello private`;
  }
}
