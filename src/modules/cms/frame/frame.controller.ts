import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { FrameService } from './frame.service.js';
import {
  CreateCustomFrameDto,
  CreateFrameDto,
  FilterFrameDto,
} from '../../../dto/frame.dto.js';
import { FrameFileValidationPipe } from '../../../common/pipe/file.pipe.js';
import { ResponseMessage } from '../../../common/decorators/metadata.decorator.js';
import { SetActiveDto } from '../../../dto/setActive.dto.js';

@Controller('frame')
export class FrameController {
  constructor(private readonly frameService: FrameService) {}

  @Post()
  @ResponseMessage('Frame created successfully')
  @UseInterceptors(FileInterceptor('frame'))
  async normalFrame(
    @Body() dto: CreateFrameDto,
    @CurrentUser()
    user: RequestUser,
    @UploadedFile(FrameFileValidationPipe()) file: Express.Multer.File,
  ) {
    await this.frameService.postNormalFrame(file, dto, user.sub, user.tenantId);
  }

  @Post('/custom-frame')
  @ResponseMessage('Custom frame created successfully')
  @UseInterceptors(FileInterceptor('frame'))
  async customFrame(
    @Body() dto: CreateCustomFrameDto,
    @CurrentUser()
    user: RequestUser,
    @UploadedFile(FrameFileValidationPipe()) file: Express.Multer.File,
  ) {
    await this.frameService.postCustomFrame(file, dto, user);
  }

  @Get()
  @ResponseMessage('Frames retrieved successfully')
  async getFrame(
    @CurrentUser()
    user: RequestUser,
    @Query() filter: FilterFrameDto,
  ) {
    return await this.frameService.getFrame(user.tenantId, user.sub, filter);
  }

  @Get('/custom-frame')
  @ResponseMessage('Custom frames retrieved successfully')
  async getCustomFrame(
    @CurrentUser()
    user: RequestUser,
    @Query() filter: FilterFrameDto,
  ) {
    return await this.frameService.getCustomFrame(
      user.tenantId,
      user.sub,
      filter,
    );
  }

  @ResponseMessage('Frame status updated successfully')
  @Patch(':id/status')
  async setActive(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetActiveDto,
  ) {
    return await this.frameService.patchVoucherActive(
      user.tenantId,
      id,
      dto.isActive,
      user.sub,
    );
  }
}
