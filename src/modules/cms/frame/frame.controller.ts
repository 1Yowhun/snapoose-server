import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../../common/decorators/public.decorator.js';
import { FrameService } from './frame.service.js';
import {
  CreateCustomFrameDto,
  CreateFrameDto,
} from '../../../dto/frame.dto.js';
import { FrameFileValidationPipe } from '../../../common/pipe/file.pipe.js';

@Controller('frame')
export class FrameController {
  constructor(private readonly frameService: FrameService) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('frame'))
  async normalFrame(
    @Body() dto: CreateFrameDto,
    @CurrentUser()
    user: RequestUser,
    @UploadedFile(FrameFileValidationPipe()) file: Express.Multer.File,
  ) {
    const frame = await this.frameService.postNormalFrame(file, dto, user);
    const response = {
      success: true,
      message: 'Frame created successfully',
      data: frame,
    };
    return response;
  }

  @Post('/custom-frame')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('frame'))
  async customFrame(
    @Body() dto: CreateCustomFrameDto,
    @CurrentUser()
    user: RequestUser,
    @UploadedFile(FrameFileValidationPipe()) file: Express.Multer.File,
  ) {
    await this.frameService.postCustomFrame(file, dto, user);
    const response = {
      success: true,
      message: 'Custom Frame created successfully',
    };
    return response;
  }

  @Get()
  @HttpCode(200)
  async getFrame() {
    const getFrame = await this.frameService.getFrame();
    const response = {
      success: true,
      message: 'Get Frame successfully',
      data: getFrame,
    };
    return response;
  }

  @Get('/custom-frame')
  @HttpCode(200)
  async getCustomFrame() {
    const getFrame = await this.frameService.getCustomFrame();
    const response = {
      success: true,
      message: 'Get Frame successfully',
      data: getFrame,
    };
    return response;
  }
}
