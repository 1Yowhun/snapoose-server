import { Injectable, Inject } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { R2_CLIENT } from '../../shared/infra/cloudflare/r2.factory.js';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  tenants,
  NewTenant,
  Tenant,
} from '../../shared/infra/database/schema/tenant.schema.js';

@Injectable()
export class TenantRepository {
  constructor(
    @Inject('FIRESTORE') private readonly firestore: Firestore,
    @Inject(R2_CLIENT) private readonly r2: S3Client,
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
    private readonly configService: ConfigService,
  ) {}

  async findById(tenantId: string) {
    const doc = await this.firestore.collection('tenants').doc(tenantId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async insertTenant(data: NewTenant): Promise<Tenant> {
    const [tenant] = await this.db.insert(tenants).values(data).returning();
    return tenant;
  }

  async insertPhotoLogo(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ key: string; etag?: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('R2_BUCKET_NAME'),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    const response = await this.r2.send(command);

    return {
      key,
      etag: response.ETag,
      url: `${this.configService.get('R2_PUBLIC_URL').trim()}${key}`,
    };
  }
}
