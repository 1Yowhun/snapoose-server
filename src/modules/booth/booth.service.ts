import { Injectable, NotFoundException } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { CreateBoothDto, FilterBoothDto } from '../../dto/booth.dto.js';
import { BoothRepository } from './booth.repository.js';
import { TenantRepository } from '../tenant/tenant.repository.js';

@Injectable()
export class BoothService {
  constructor(
    private readonly logger: AppLogger,
    private readonly tenantRepository: TenantRepository,
    private readonly boothRepository: BoothRepository,
  ) {}

  async createBooth(dto: CreateBoothDto, tenantId: string, userId: string) {
    const location = await this.boothRepository.findLocationById(
      dto.locationId,
      tenantId,
    );
    if (!location) throw new NotFoundException('Location not found');

    const booth = await this.boothRepository.create({
      ...dto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    this.logger.log(
      `Booth created: tenantId=${tenantId} userId=${userId}`,
      BoothService.name,
    );
    return booth;
  }

  async getBoothList(tenantId: string, filter: FilterBoothDto) {
    const booth = await this.boothRepository.getBoothList(tenantId, filter);
    this.logger.debug(
      `Booths retrieved: tenantId=${tenantId} count=${booth.items.length}`,
      BoothService.name,
    );
    return booth;
  }

  async updateBoothStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    const booth = await this.boothRepository.updateStatus(
      tenantId,
      id,
      isActive,
      userId,
    );
    if (!booth) throw new NotFoundException('Booth not found');

    this.logger.log(
      `Booth status updated: boothId=${id} tenantId=${tenantId} userId=${userId} isActive=${booth.isActive}`,
      BoothService.name,
    );
    return booth;
  }
}
