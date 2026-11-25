import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2_CLIENT } from '../cloudflare/r2.factory.js';

@Injectable()
export class StorageService {
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(
    @Inject(R2_CLIENT) private readonly r2: S3Client,
    config: ConfigService,
  ) {
    this.publicBaseUrl = config.getOrThrow<string>('R2_PUBLIC_URL');
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
  }

  async upload(key: string, body: Buffer, contentType: string) {
    await this.r2.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteMany(keys: string[]) {
    if (!keys.length) return;
    await this.r2.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
  }

  // untuk <img> / <video> di halaman galeri
  previewUrl(key: string, expiresIn = 3600) {
    return getSignedUrl(
      this.r2,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async getUrl(key: string) {
    return key;
  }

  // untuk tombol unduh (memaksa download)
  downloadUrl(key: string, filename: string, expiresIn = 300) {
    return getSignedUrl(
      this.r2,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      }),
      { expiresIn },
    );
  }
}
