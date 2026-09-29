import { Module } from '@nestjs/common';
import { FrameService } from './frame.service.js';
import { FrameController } from './frame.controller.js';
import { FrameRepository } from './frame.repository.js';

@Module({
  providers: [FrameService, FrameRepository],
  controllers: [FrameController],
})
export class FrameModule {}
