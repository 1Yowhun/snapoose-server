// src/infra/database/firestore/firestore.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firestoreFactory } from './firestore/firestore.factory.js';
import { R2_CLIENT, r2Factory } from '../cloudflare/r2.factory.js';
import { DRIZZLE, drizzleFactory } from './drizzle.factory.js';

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
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: drizzleFactory,
    }
  ],
  exports: ['FIRESTORE', 'R2_CLIENT', 'DRIZZLE'],
})
export class ProviderModule {}
