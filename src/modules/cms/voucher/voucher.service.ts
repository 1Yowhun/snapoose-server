import { Injectable, NotFoundException } from '@nestjs/common';
import { AppLogger } from '../../../common/logger.service.js';
import { VoucherRepository } from './voucher.repository.js';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../../../dto/voucher.dto.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { TenantRepository } from '../../tenant/tenant.repository.js';

@Injectable()
export class VoucherService {
  constructor(
    private readonly voucherRepository: VoucherRepository,
    private readonly logger: AppLogger,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async postVoucher(data: CreateVoucherDto, user: RequestUser) {
    try {
      const now = new Date();
      const idTenant = await this.tenantRepository.findById(user.tenantId);
      if (!idTenant) throw new NotFoundException('Tenant tidak ditemukan');
      const payload = {
        ...data,
        code: `VCH-${Date.now()}`,
        tenantId: idTenant.id,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        updatedBy: user.sub,
        createdBy: user.sub,
      };

      const voucher = await this.voucherRepository.createVoucher(payload);
      this.logger.log(`Voucher berhasil dibuat`, VoucherService.name);
      return voucher;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat Voucher',
        error,
        VoucherService.name,
      );
      throw error;
    }
  }

  async putVoucher(data: UpdateVoucherDto, user: RequestUser, id: string) {
    try {
      const [voucherId, idTenant] = await Promise.all([
        this.voucherRepository.findVoucherById(id),
        this.tenantRepository.findById(user.tenantId),
      ]);

      if (!idTenant) throw new NotFoundException('Tenant tidak ditemukan');
      if (!voucherId) throw new NotFoundException('Voucher tidak ditemukan');

      const now = new Date();

      const payload = {
        ...data,
        tenantId: idTenant.id,
        updatedAt: now,
        updatedBy: user.sub,
      };

      const voucher = await this.voucherRepository.updateVoucherById(
        voucherId.id,
        payload,
      );
      this.logger.log(`Voucher berhasil diupdate`, VoucherService.name);
      return voucher;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika update voucher',
        error,
        VoucherService.name,
      );
      throw error;
    }
  }

  async getVoucher() {
    try {
      const voucher = await this.voucherRepository.getAllVoucherList();
      this.logger.log(`Voucher berhasil diget`, VoucherService.name);
      return voucher;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika mengambil data voucher',
        error,
        VoucherService.name,
      );
      throw error;
    }
  }
}
