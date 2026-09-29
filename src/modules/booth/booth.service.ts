import { Injectable, NotFoundException } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { CreateBoothDto } from '../../dto/createBooth.dto.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { LocationRepository } from '../location/location.repository.js';
import { BoothRepository } from './booth.repository.js';
import { TenantRepository } from '../tenant/tenant.repository.js';

@Injectable()
export class BoothService {
  constructor(
    private readonly logger: AppLogger,
    private readonly tenantRepository: TenantRepository,
    private readonly boothRepository: BoothRepository,
  ) {}

  async createBooth(
    data: CreateBoothDto,
    user: RequestUser,
    locationId: string,
  ) {
    try {
      const [tenant, location] = await Promise.all([
        await this.tenantRepository.findById(user.tenantId),
        await this.boothRepository.findLocationById(locationId),
      ]);
      if (!tenant) throw new NotFoundException('Tenant tidak ditemukan');
      if (!location) throw new NotFoundException('Location tidak ditemukan');

      const now = new Date();

      const payload = {
        ...data,
        tenantId: user.tenantId,
        code: `BTH-${Date.now()}`,
        status: true,
        createdBy: user.sub,
        updatedBy: user.sub,
        installedAt: now,
        updatedAt: now,
      };
      const booth = await this.boothRepository.create(locationId, payload);
      this.logger.log(`booth berhasil dibuat`, BoothService.name);
      return booth;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat booth',
        error,
        BoothService.name,
      );
      throw error;
    }
  }
}
