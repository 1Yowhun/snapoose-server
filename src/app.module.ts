import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProviderModule } from './shared/infra/database/provider.module.js';
import { RoleModule } from './modules/iam/role/role.module.js';
import { CommonModule } from './common/common.module.js';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger.config.js';
import { AuthModule } from './modules/iam/auth/auth.module.js';
import { logMiddleware } from './common/middleware/logger.middleware.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/middleware/auth.middleware.js';
import { JwtModule } from '@nestjs/jwt';
import { LocationModule } from './modules/location/location.module.js';
import { BoothModule } from './modules/booth/booth.module.js';
import { FrameModule } from './modules/cms/frame/frame.module.js';
import { VoucherModule } from './modules/cms/voucher/voucher.module.js';
import { ProductModule } from './modules/cms/product/product.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY || '',
      appSecret: process.env.OBSERVE_APP_SECRET || '',
      serviceId: 'snapoose_pro',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: '2h' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRoot(winstonConfig),
    ProviderModule,
    RoleModule,
    CommonModule,
    AuthModule,    LocationModule,
    BoothModule,
    FrameModule,
    VoucherModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(logMiddleware).forRoutes({
      path: '*path',
      method: RequestMethod.ALL,
    });
  }
}
