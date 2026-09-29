import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { VoucherService } from './voucher.service.js';
import { CurrentUser } from '../../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../../../dto/voucher.dto.js';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @HttpCode(201)
  @Header('content-type', 'application/json')
  async createVoucher(
    @Body() dto: CreateVoucherDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    await this.voucherService.postVoucher(dto, user);
    const response = {
      success: true,
      message: 'Voucher created successfully',
    };
    return response;
  }

  @Put(':id')
  @HttpCode(201)
  @Header('content-type', 'application/json')
  async updateVoucher(
    @Body() dto: UpdateVoucherDto,
    @Param('id') id: string,
    @CurrentUser()
    user: RequestUser,
  ) {
    await this.voucherService.putVoucher(dto, user, id);
    const response = {
      success: true,
      message: 'Voucher updated successfully',
    };
    return response;
  }

  @Get()
  @HttpCode(200)
  async getVoucherList() {
    const voucher = await this.voucherService.getVoucher();
    const response = {
      success: true,
      message: 'Voucher get successfully',
      data: voucher,
    };
    return response;
  }
}
