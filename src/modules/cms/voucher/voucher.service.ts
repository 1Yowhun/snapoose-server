import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLogger } from '../../../common/logger.service.js';
import { VoucherRepository } from './voucher.repository.js';
import {
  CreateVoucherDto,
  VoucherFilterDto,
} from '../../../dto/voucher.dto.js';
import { TenantRepository } from '../../tenant/tenant.repository.js';

@Injectable()
export class VoucherService {
  constructor(
    private readonly voucherRepository: VoucherRepository,
    private readonly logger: AppLogger,
  ) {}

  async postVoucher(tenantId: string, data: CreateVoucherDto, userId: string) {
    const { boothIds, ...voucherDetails } = data;
    const newVoucherData = {
      ...voucherDetails,
      tenantId: tenantId,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      createdBy: userId,
      updatedBy: userId,
    };
    const voucher = await this.voucherRepository.createVoucher(
      { ...newVoucherData },
      boothIds,
    );
    this.logger.log(
      `Voucher created: voucherId=${voucher.id} tenantId=${tenantId} userId=${userId}`,
      VoucherService.name,
    );
    return voucher;
  }

  async getVoucherList(tenantId: string, filter: VoucherFilterDto) {
    if (
      filter.remainingMin !== undefined &&
      filter.remainingMax !== undefined &&
      filter.remainingMin > filter.remainingMax
    ) {
      throw new BadRequestException(
        'Minimum remaining quota must not exceed maximum remaining quota',
      );
    }

    const vouchers = await this.voucherRepository.getVoucher(tenantId, filter);
    this.logger.debug(
      `Vouchers retrieved: tenantId=${tenantId} count=${vouchers.items.length}`,
      VoucherService.name,
    );
    return vouchers;
  }

  async patchVoucherActive(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    const voucher = await this.voucherRepository.getVoucherById(tenantId, id);
    if (!voucher) throw new NotFoundException('Voucher not found');

    const voucherUpdate = await this.voucherRepository.updateActive(
      tenantId,
      id,
      isActive,
      userId,
    );
    this.logger.log(
      `Voucher status updated: voucherId=${id} tenantId=${tenantId} userId=${userId} isActive=${isActive}`,
      VoucherService.name,
    );
    return voucherUpdate;
  }
}
