// src/infra/database/firestore/firestore.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firestoreFactory } from './firestore/firestore.factory.js';

@Global()
@Module({
  providers: [
    {
      provide: 'FIRESTORE',
      inject: [ConfigService],
      useFactory: firestoreFactory,
    },
  ],
  exports: ['FIRESTORE'],
})
export class FireStoreModule {}
