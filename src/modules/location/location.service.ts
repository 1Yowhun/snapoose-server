import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { CreateLocationDto } from '../../dto/location.dto.js';
import { LocationRepository } from './location.repository.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { TenantRepository } from '../tenant/tenant.repository.js';
import { generateId } from '../../common/utils/generateCode.js';

@Injectable()
export class LocationService {
  constructor(
    private readonly logger: AppLogger,
    private readonly locationRepository: LocationRepository,
  ) {}

  async createLocation(data: CreateLocationDto, user: RequestUser) {
    try {
      const payload = {
        ...data,
        tenantId: user.tenantId,
        createdBy: user.sub,
        updatedBy: user.sub,
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

  async getLocationList(tenantId: string) {
    try {
      this.logger.log(`Location berhasil diambil`, LocationService.name);
      return await this.locationRepository.getLocationData(tenantId);
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika mengambil Location',
        error,
        LocationService.name,
      );
      throw error;
    }
  }

  async getById(tenantId: string, id: string) {
    const location = await this.locationRepository.findById(tenantId, id);
    if (!location) throw new NotFoundException('Lokasi tidak ditemukan');
    return location;
  }

  async setActive(tenantId: string, id: string, isActive: boolean) {
    const location = await this.getById(tenantId, id);
    if (isActive && !location.storeName && !location.street) {
      throw new BadRequestException('Lengkapi data lokasi sebelum diaktifkan');
    }
    return this.locationRepository.updateActive(tenantId, id, isActive);
  }

  async getNameId(tenantId: string) {
    try {
      this.logger.log(`Daftar Location berhasil diambil`, LocationService.name);
      return await this.locationRepository.getNameId(tenantId);
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
