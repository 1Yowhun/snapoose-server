import { Injectable, Inject } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { R2_CLIENT } from '../../shared/infra/cloudflare/r2.factory.js';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  tenants,
  NewTenant,
} from '../../shared/infra/database/schema/tenant.schema.js';

@Injectable()
export class TenantRepository {
  constructor(
    @Inject(R2_CLIENT) private readonly r2: S3Client,
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
    private readonly configService: ConfigService,
  ) {}

  async insertTenant(data: NewTenant) {
    return await this.db
      .insert(tenants)
      .values(data)
      .returning({ id: tenants.id, name: tenants.brandName });
  }

  async uploadLogo(key: string, buffer: Buffer, contentType: string) {
    await this.r2.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow<string>('R2_BUCKET_NAME'),
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  async deleteObject(key: string) {
    await this.r2.send(
      new DeleteObjectCommand({
        Bucket: this.configService.getOrThrow<string>('R2_BUCKET_NAME'),
        Key: key,
      }),
    );
  }

  publicUrl(key: string): string {
    const base = this.configService
      .getOrThrow<string>('R2_PUBLIC_URL')
      .trim()
      .replace(/\/+$/, '');
    return `${base}/${key}`;
  }
}
