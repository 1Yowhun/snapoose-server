import { Module } from '@nestjs/common';
import { LocationController } from './location.controller.js';
import { LocationRepository } from './location.repository.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { LocationService } from './location.service.js';

@Module({
  imports: [TenantModule],
  controllers: [LocationController],
  providers: [LocationService, LocationRepository],
})
export class LocationModule {}
