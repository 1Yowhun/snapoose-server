import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

export const firestoreFactory = (configService: ConfigService) => {
  const keyPath = configService.get<string>('PATH_FIRESTORE');

  if (!keyPath) {
    throw new Error('PATH_FIRESTORE tidak ditemukan di file .env!');
  }

  const resolvedPath = path.isAbsolute(keyPath)
    ? keyPath
    : path.join(process.cwd(), keyPath);

  if (admin.getApp.length === 0) {
    admin.initializeApp({
      credential: admin.cert(resolvedPath),
    });
  }

  return getFirestore();
};
