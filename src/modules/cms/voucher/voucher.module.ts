import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service.js';
import { VoucherController } from './voucher.controller.js';
import { VoucherRepository } from './voucher.repository.js';
import { TenantRepository } from '../../tenant/tenant.repository.js';

@Module({
  providers: [VoucherService, VoucherRepository, TenantRepository],
  controllers: [VoucherController],
})
export class VoucherModule {}
