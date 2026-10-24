import crypto from 'crypto';
import { InternalServerErrorException } from '@nestjs/common';

export function encryptAccessToken(
  accessToken: string,
  secretKeyHex: string,
): string {
  try {
    if (!secretKeyHex) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }

    const key = Buffer.from(secretKeyHex, 'hex');
    if (key.length !== 32) {
      throw new Error(
        'ENCRYPTION_KEY must contain 32 bytes (64 hexadecimal characters)',
      );
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(accessToken, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failure:', error);
    throw new InternalServerErrorException(
      'Unable to create an authentication token',
    );
  }
}
