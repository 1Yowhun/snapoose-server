import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2_CLIENT, r2Factory } from './cloudflare/r2.factory.js';
import { DRIZZLE, drizzleFactory } from './database/drizzle.factory.js';
import { MidtransClient } from './midtrans/midtrans.client.js';
import { StorageService } from './cloudflare/storage.service.js';

@Global()
@Module({
  providers: [
    {
      provide: R2_CLIENT,
      inject: [ConfigService],
      useFactory: r2Factory,
    },
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: drizzleFactory,
    },
    MidtransClient,
    StorageService,
  ],
  exports: ['R2_CLIENT', 'DRIZZLE', MidtransClient, StorageService],
})
export class ProviderModule {}
