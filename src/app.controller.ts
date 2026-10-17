import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppLogger } from './common/logger.service.js';
import { Public } from './common/decorators/public.decorator.js';
import { ResponseMessage } from './common/decorators/metadata.decorator.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: AppLogger,
  ) {}

  @Public()
  @Get('/test')
  @ResponseMessage('Test endpoint accessed successfully')
  async getHello() {
    return `hello world`;
  }

  @Get('/private')
  @ResponseMessage('Protected endpoint accessed successfully')
  async getPrivate() {
    return `hello private`;
  }
}
