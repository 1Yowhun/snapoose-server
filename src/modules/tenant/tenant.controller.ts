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
import { ResponseMessage } from '../../common/decorators/metadata.decorator.js';
import { CreateTenantDto } from '../../dto/tenant.dto.js';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  @ResponseMessage('Tenant created successfully')
  @Header('content-type', 'application/json')
  async createTenant(
    @Body() dto: CreateTenantDto,
    @UploadedFile(FrameFileValidationPipe()) file: Express.Multer.File,
  ) {
    return await this.tenantService.postTenant(file, dto);
  }
}
