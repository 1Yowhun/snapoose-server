// tenant.module.ts
import { Module } from '@nestjs/common';
import { TenantRepository } from './tenant.repository.js';
import { TenantService } from './tenant.service.js';
import { TenantController } from './tenant.controller.js';

@Module({
  providers: [TenantRepository, TenantService],
  exports: [TenantRepository],
  controllers: [TenantController], 
})
export class TenantModule {}
