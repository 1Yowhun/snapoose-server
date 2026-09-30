import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { R2_CLIENT } from '../../../shared/infra/cloudflare/r2.factory.js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Frame } from '../../../entity/frame.entity.js';

export class FrameRepository {
  constructor(
    @Inject('FIRESTORE') private readonly firestore: Firestore,
    @Inject(R2_CLIENT) private readonly r2: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async createFrameDB(data: Omit<Frame, 'id'>): Promise<Frame> {
    const docRef = await this.firestore.collection('frames').add(data);
    return new Frame({
      id: docRef.id,
      ...data,
    });
  }

  async createFrameObject(
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

  async getAllFrame(): Promise<string[]> {
    const imageRefPath = await this.firestore
      .collection('frames')
      .where('frameType', '!=', 'CUSTOM')
      .limit(20)
      .get();
    return imageRefPath.docs.map((image) => image.data().imagePath);
  }


  // TODO: buat tipe data return di customFrame
  async getAllCustomFrame(): Promise<any[]> {
    const imageRefPath = await this.firestore
      .collection('frames')
      .where('frameType', '==', 'CUSTOM')
      .where('validFrom', '!=', null)
      .limit(20)
      .get();

    return imageRefPath.docs.map((data) => data.data());
  }
}
