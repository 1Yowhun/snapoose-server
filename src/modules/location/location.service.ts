import { Injectable, NotFoundException } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { CreateLocationDto } from '../../dto/location.dto.js';
import { LocationRepository } from './location.repository.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { TenantRepository } from '../tenant/tenant.repository.js';

@Injectable()
export class LocationService {
  constructor(
    private readonly logger: AppLogger,
    private readonly locationRepository: LocationRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async createLocation(data: CreateLocationDto, user: RequestUser) {
    try {
      const tenant = await this.tenantRepository.findById(user.tenantId);
      if (!tenant) {
        throw new NotFoundException('Tenant tidak ditemukan');
      }
      const now = new Date();
      const payload = {
        ...data,
        tenantId: tenant.id,
        code: `LOK-${Date.now()}`,
        isActive: true,
        createdBy: user.sub,
        updatedBy: user.sub,
        createdAt: now,
        updatedAt: now,
      };

      const location = await this.locationRepository.create(payload);
      this.logger.log(`Location berhasil dibuat`, LocationService.name);
      return location;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat Location',
        error,
        LocationService.name,
      );
      throw error;
    }
  }

  async getLocationList() {
    try {
      this.logger.log(`Location berhasil diambil`, LocationService.name);
      return await this.locationRepository.getLocationData();
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika mengambil Location',
        error,
        LocationService.name,
      );
      throw error;
    }
  }
}
