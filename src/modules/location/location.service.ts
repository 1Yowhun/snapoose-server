import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { CreateLocationDto, FilterLocationDto } from '../../dto/location.dto.js';
import { LocationRepository } from './location.repository.js';
import { RequestUser } from '../../entity/requestUser.entity.js';

@Injectable()
export class LocationService {
  constructor(
    private readonly logger: AppLogger,
    private readonly locationRepository: LocationRepository,
  ) {}

  async createLocation(data: CreateLocationDto, user: RequestUser) {
    const payload = {
      ...data,
      tenantId: user.tenantId,
      createdBy: user.sub,
      updatedBy: user.sub,
    };

    const location = await this.locationRepository.create(payload);
    this.logger.log(
      `Location created: tenantId=${user.tenantId} userId=${user.sub}`,
      LocationService.name,
    );
    return location;
  }

  async getLocationList(tenantId: string, filter: FilterLocationDto) {
    const locations = await this.locationRepository.getLocationData(tenantId, filter);
    this.logger.debug(
      `Locations retrieved: tenantId=${tenantId} count=${locations.items.length}`,
      LocationService.name,
    );
    return locations;
  }

  async getById(tenantId: string, id: string) {
    const location = await this.locationRepository.findById(tenantId, id);
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async setActive(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    const location = await this.getById(tenantId, id);
    if (isActive && !location.storeName && !location.street) {
      throw new BadRequestException(
        'Complete the location details before activating it',
      );
    }
    const locationUpdate = await this.locationRepository.updateActive(
      tenantId,
      id,
      isActive,
      userId,
    );
    this.logger.log(
      `Location status updated: locationId=${id} tenantId=${tenantId} userId=${userId} isActive=${isActive}`,
      LocationService.name,
    );
    return locationUpdate;
  }

  async getNameId(tenantId: string) {
    const locations = await this.locationRepository.getNameId(tenantId);
    this.logger.debug(
      `Location options retrieved: tenantId=${tenantId} count=${locations.length}`,
      LocationService.name,
    );
    return locations;
  }
}
