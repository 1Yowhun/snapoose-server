import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { BoothService } from './booth.service.js';
import { CreateBoothDto } from '../../dto/createBooth.dto.js';

@Controller('location/:locationId/booth')
export class BoothController {
  constructor(private readonly boothService: BoothService) {}

  @Post()
  @HttpCode(201)
  @Header('content-type', 'application/json')
  async createBooth(
    @Param('locationId') locationId: string,
    @Body() dto: CreateBoothDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    console.log(locationId, user);
    const createUser = await this.boothService.createBooth(dto, user, locationId);
    const response = {
      success: true,
      message: 'Location created successfully',
      data: createUser,
    };
    return response;
  }
}
