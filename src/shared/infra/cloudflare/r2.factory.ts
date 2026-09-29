// r2/r2.provider.ts
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, Provider } from '@nestjs/common';

export const R2_CLIENT = 'R2_CLIENT';

export const r2Factory = (configService: ConfigService) => {
  const id = configService.get('R2_ACCOUNT_ID');
  const keyId = configService.get('R2_ACCESS_KEY_ID');
  const accessKey = configService.get('R2_SECRET_ACCESS_KEY');

  if (!id && !keyId && !accessKey) {
    throw new NotFoundException('.env tidak ada');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${id}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: accessKey,
    },
  });
};
