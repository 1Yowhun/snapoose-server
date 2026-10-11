import { Injectable, NotFoundException } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { CreateBoothDto, FilterBoothDto } from '../../dto/booth.dto.js';
import { RequestUser } from '../../entity/requestUser.entity.js';
import { LocationRepository } from '../location/location.repository.js';
import { BoothRepository } from './booth.repository.js';
import { TenantRepository } from '../tenant/tenant.repository.js';
import { generateId } from '../../common/utils/generateCode.js';

@Injectable()
export class BoothService {
  constructor(
    private readonly logger: AppLogger,
    private readonly tenantRepository: TenantRepository,
    private readonly boothRepository: BoothRepository,
  ) {}

  async createBooth(dto: CreateBoothDto, tenantId: string, userId: string) {
    try {
      const location = await this.boothRepository.findLocationById(
        dto.locationId,
        tenantId,
      );
      if (!location) throw new NotFoundException('Lokasi tidak ditemukan');

      const booth = await this.boothRepository.create({
        ...dto,
        tenantId,
        createdBy: userId,
        updatedBy: userId,
      });
      this.logger.log(`Booth berhasil dibuat`, BoothService.name);
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

  async getBoothList(tenantId: string, filter: FilterBoothDto) {
    try {
      const booth = await this.boothRepository.getBoothList(tenantId, filter);
      this.logger.log(`Berhasil mengambil Booth list`, BoothService.name);
      return booth;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika mengambil booth list',
        error,
        BoothService.name,
      );
      throw error;
    }
  }

  async updateBoothStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    try {
      const booth = await this.boothRepository.updateStatus(
        tenantId,
        id,
        isActive,
        userId,
      );
      if (!booth) throw new NotFoundException('Booth tidak ditemukan');

      this.logger.log(
        `Booth ${booth.code} ${isActive ? 'diaktifkan' : 'dinonaktifkan'} oleh user ${userId}`,
      );
      return booth;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika mengambil Location',
        error,
        BoothService.name,
      );
      throw error;
    }
  }
}
