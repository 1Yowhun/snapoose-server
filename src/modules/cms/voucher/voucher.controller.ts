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
import { VoucherService } from './voucher.service.js';
import { CurrentUser } from '../../../common/decorators/currentUser.decorator.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import {
  CreateVoucherDto,
  VoucherFilterDto,
} from '../../../dto/voucher.dto.js';
import { ResponseMessage } from '../../../common/decorators/metadata.decorator.js';
import { SetActiveDto } from '../../../dto/setActive.dto.js';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @ResponseMessage('Voucher created successfully')
  @Header('content-type', 'application/json')
  async createVoucher(
    @Body() dto: CreateVoucherDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    await this.voucherService.postVoucher(user.tenantId, dto, user.sub);
  }

  @ResponseMessage('Voucher status updated successfully')
  @Patch(':id/status')
  async setActive(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetActiveDto,
  ) {
    return await this.voucherService.patchVoucherActive(
      user.tenantId,
      id,
      dto.isActive,
      user.sub,
    );
  }

  @Get()
  @ResponseMessage('Vouchers retrieved successfully')
  async getVoucherList(
    @CurrentUser()
    user: RequestUser,
    @Query() filter: VoucherFilterDto,
  ) {
    return await this.voucherService.getVoucherList(user.tenantId, filter);
  }
}
