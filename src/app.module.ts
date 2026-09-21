import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { FireStoreModule } from './shared/infra/database/firestore.module.js';
import { RoleModule } from './modules/iam/role/role.module.js';
import { CommonModule } from './common/common.module.js';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger.config.js';
import { AuthModule } from './modules/iam/auth/auth.module.js';
import { logMiddleware } from './common/middleware/logger.middleware.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/middleware/auth.middleware.js';
import { JwtModule } from '@nestjs/jwt';
import { DeviceModule } from './modules/device/device.module.js';
import { LocationModule } from './modules/location/location.module.js';
import { BoothModule } from './modules/booth/booth.module.js';

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
    JwtModule.register({}),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRoot(winstonConfig),
    FireStoreModule,
    RoleModule,
    CommonModule,
    AuthModule,
    DeviceModule,
    LocationModule,
    BoothModule,
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
