import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { BoothService } from './booth.service.js';
import { CreateBoothDto, FilterBoothDto } from '../../dto/booth.dto.js';
import { ResponseMessage } from '../../common/decorators/metadata.decorator.js';
import { SetActiveDto } from '../../dto/setActive.dto.js';

@Controller('booth')
export class BoothController {
  constructor(private readonly boothService: BoothService) {}

  @Post()
  @ResponseMessage('Booth has been created successfully')
  @Header('content-type', 'application/json')
  async createBooth(
    @Body() dto: CreateBoothDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    await this.boothService.createBooth(dto, user.tenantId, user.sub);
  }

  @Get()
  @ResponseMessage('Booths retrieved successfully')
  @Header('content-type', 'application/json')
  async getBoothList(
    @CurrentUser()
    user: RequestUser,
    @Query() filter: FilterBoothDto,
  ) {
    return await this.boothService.getBoothList(user.tenantId, filter);
  }

  @Patch(':id/status')
  @ResponseMessage('Booths updated successfully')
  @Header('content-type', 'application/json')
  async updateBoothStatuses(
    @CurrentUser()
    user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetActiveDto,
  ) {
    await this.boothService.updateBoothStatus(
      user.tenantId,
      id,
      dto.isActive,
      user.sub,
    );
  }
}
