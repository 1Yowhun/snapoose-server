import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service.js';
import { CreateTenantDto } from '../../dto/tenant.dto.js';
import { randomUUID } from 'crypto';
import { TenantRepository } from './tenant.repository.js';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly logger: AppLogger,
  ) {}
  async postTenant(file: Express.Multer.File, data: CreateTenantDto) {
    try {
      const key = `tenants/${randomUUID()}-${file.originalname}`;

      const tenantlogo = await this.tenantRepository.insertPhotoLogo(
        key,
        file.buffer,
        file.mimetype,
      );

      const url = tenantlogo.url;
      console.log(url);

      const payload = {
        ...data,
        logoUrl: url,
      };

      const tenant = await this.tenantRepository.insertTenant(payload);
      this.logger.log(`Tenant berhasil dibuat`, TenantService.name);
      return tenant;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat Tenant',
        error,
        TenantService.name,
      );
      throw error;
    }
  }
}
