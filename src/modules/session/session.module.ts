import { Module } from '@nestjs/common';
import { SessionService } from './session.service.js';
import { SessionController } from './session.controller.js';
import { SessionRepository } from './session.repository.js';
import { PublicSessionService } from './public-session.service.js';
import { PublicSessionController } from './public-session.controller.js';

@Module({
  providers: [SessionService, PublicSessionService, SessionRepository],
  controllers: [SessionController, PublicSessionController],
})
export class SessionModule {}
