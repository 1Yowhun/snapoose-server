import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
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

  MIME_EXT: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  async postTenant(file: Express.Multer.File, data: CreateTenantDto) {
    const ext = this.MIME_EXT[file.mimetype];
    if (!ext) throw new BadRequestException('Unsupported logo type');

    const id = randomUUID();
    const key = `tenants/${id}/logo.${ext}`;
    await this.tenantRepository.uploadLogo(key, file.buffer, file.mimetype);

    try {
      const [tenant] = await this.tenantRepository.insertTenant({
        ...data,
        id,
        logoUrl: this.tenantRepository.publicUrl(key),
      });

      this.logger.log(`Tenant created: ${tenant.id}`, TenantService.name);
      return tenant;
    } catch (err: any) {
      await this.tenantRepository
        .deleteObject(key)
        .catch((e) =>
          this.logger.error(
            `Failed to delete orphan logo ${key}`,
            String(e),
            TenantService.name,
          ),
        );

      const pgErr = err?.cause ?? err;
      if (pgErr?.code === '23505') {
        const field = pgErr.constraint?.includes('brand_name')
          ? 'Brand name'
          : 'Name';
        throw new ConflictException(`${field} already exists`);
      }
      throw err;
    }
  }
}
