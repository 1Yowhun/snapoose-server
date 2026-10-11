import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  CreateLocationDto,
  SetLocationActiveDto,
} from '../../dto/location.dto.js';
import { CurrentUser } from '../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { LocationService } from './location.service.js';
import { ResponseMessage } from '../../common/decorators/metadata.decorator.js';
import { SetActiveDto } from '../../dto/setActive.dto.js';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ResponseMessage('Location created successfully')
  @Header('content-type', 'application/json')
  async createLocation(
    @Body() dto: CreateLocationDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    return await this.locationService.createLocation(dto, user);
  }

  @Get()
  @ResponseMessage("Location's data has been got successfully")
  @Header('content-type', 'application/json')
  async getDataLocation(
    @CurrentUser()
    user: RequestUser,
  ) {
    return await this.locationService.getLocationList(user.tenantId);
  }

  @ResponseMessage("Location's status has been updated successfully")
  @Patch(':id/status')
  async setActive(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetActiveDto,
  ) {
    return await this.locationService.setActive(
      user.tenantId,
      id,
      dto.isActive,
    );
  }

  @Get('/options')
  async getLocationDataDropdown(
    @CurrentUser()
    user: RequestUser,
  ) {
    return await this.locationService.getNameId(user.tenantId);
  }
}
