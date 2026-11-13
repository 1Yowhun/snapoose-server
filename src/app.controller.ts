import { Body, Controller, Get, Header, Headers, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './common/decorators/public.decorator.js';
import { ResponseMessage } from './common/decorators/metadata.decorator.js';
import { CurrentUser } from './common/decorators/currentUser.decorator.js';
import { RequestUser } from './entity/requestUser.entity.js';
import { CreateInstallDto } from './dto/install.dto.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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

  // Butuh user token (hasil login); mengembalikan device token untuk desktop
  @Post('/desk/install')
  @ResponseMessage('Desktop Installation successfully')
  @Header('content-type', 'application/json')
  async installDesktop(
    @CurrentUser() user: RequestUser,
    @Headers('x-device-id') serialNumber: string,
    @Body() dto: CreateInstallDto,
  ) {
    return this.appService.installationDevice(user, serialNumber, dto);
  }
}
