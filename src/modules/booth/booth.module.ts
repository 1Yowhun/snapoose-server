import { Module } from '@nestjs/common';
import { BoothController } from './booth.controller.js';
import { BoothService } from './booth.service.js';
import { BoothRepository } from './booth.repository.js';
import { LocationRepository } from '../location/location.repository.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  providers: [BoothService, BoothRepository, LocationRepository],
  controllers: [BoothController],
  imports: [TenantModule],
})
export class BoothModule {}
