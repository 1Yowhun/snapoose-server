import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateLocationDto,
  FilterLocationDto,
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
  @ResponseMessage('Locations retrieved successfully')
  @Header('content-type', 'application/json')
  async getDataLocation(
    @CurrentUser()
    user: RequestUser,
    @Query() filter: FilterLocationDto,
  ) {
    return await this.locationService.getLocationList(user.tenantId, filter);
  }

  @ResponseMessage('Location status updated successfully')
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
      user.sub,
    );
  }

  @Get('/dropdown')
  @ResponseMessage('Location options retrieved successfully')
  async getLocationDataDropdown(
    @CurrentUser()
    user: RequestUser,
  ) {
    return await this.locationService.getNameId(user.tenantId);
  }
}
