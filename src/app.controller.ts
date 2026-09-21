import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppLogger } from './common/logger.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: AppLogger,
  ) {}

  @Get('/test')
  async getHello() {
    return this.logger.log(
      `GET /test - Response: test test bro`,
      'App Controller',
    );
  }
}
