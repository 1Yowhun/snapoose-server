// tenant.module.ts
import { Module } from '@nestjs/common';
import { TenantRepository } from './tenant.repository.js';

@Module({
  providers: [TenantRepository],
  exports: [TenantRepository], // ← WAJIB di-export biar bisa dipakai module lain
})
export class TenantModule {}