// src/infra/database/firestore/firestore.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firestoreFactory } from './firestore/firestore.factory.js';
import { R2_CLIENT, r2Factory } from '../cloudflare/r2.factory.js';

@Global()
@Module({
  providers: [
    {
      provide: 'FIRESTORE',
      inject: [ConfigService],
      useFactory: firestoreFactory,
    },
    {
      provide: R2_CLIENT,
      inject: [ConfigService],
      useFactory: r2Factory,
    },
  ],
  exports: ['FIRESTORE', 'R2_CLIENT'],
})
export class ProviderModule {}
