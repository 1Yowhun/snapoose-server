import {
  Body,
  Controller,
  Header,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { FrameFileValidationPipe } from '../../common/pipe/file.pipe.js';
import { TenantService } from './tenant.service.js';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  @HttpCode(201)
  @Header('content-type', 'application/json')
  async createTenant(
    @Body() dto: any,
    @UploadedFile(FrameFileValidationPipe()) file: Express.Multer.File,
  ) {
    await this.tenantService.postTenant(file, dto);
    const response = {
      success: true,
      message: 'Tenant created successfully',
    };
    return response;
  }
}
