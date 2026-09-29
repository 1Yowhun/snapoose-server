import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Ip,
  Post,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CreateLocationDto } from '../../dto/location.dto.js';
import { CurrentUser } from '../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { LocationService } from './location.service.js';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(201)
  @Header('content-type', 'application/json')
  async createLocation(
    @Body() dto: CreateLocationDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    await this.locationService.createLocation(dto, user);
    const response = {
      success: true,
      message: 'Location created successfully',
    };
    return response;
  }

  @Get()
  @HttpCode(200)
  @Header('content-type', 'application/json')
  async getDataLocation() {
    const location = await this.locationService.getLocationList();
    const response = {
      success: true,
      message: 'Location Get successfully',
      data: location,
    };
    return response;
  }
}
