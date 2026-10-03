import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  CreateCustomFrameDto,
  CreateFrameDto,
} from '../../../dto/frame.dto.js';
import { FrameRepository } from './frame.repository.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { AppLogger } from '../../../common/logger.service.js';
import { generateId } from '../../../common/utils/generateCode.js';

@Injectable()
export class FrameService {
  constructor(
    private readonly frameRepository: FrameRepository,
    private readonly logger: AppLogger,
  ) {}

  async postNormalFrame(
    file: Express.Multer.File,
    data: CreateFrameDto,
    user: RequestUser,
  ) {
    try {
      const key = `frames/${randomUUID()}-${file.originalname}`;

      const framePhoto = await this.frameRepository.createFrameObject(
        key,
        file.buffer,
        file.mimetype,
      );

      const url = framePhoto.url;

      const now = new Date();
      const payload = {
        ...data,

        code: `FRM-${generateId()}`,
        tenantId: user.tenantId,
        imagePath: url,
        isActive: true,
        validFrom: null,
        validUntil: null,
        createdBy: user.sub,
        updatedBy: user.sub,
        createdAt: now,
        updatedAt: now,
      };

      const frame = await this.frameRepository.createFrameDB(payload);
      this.logger.log(`Frame berhasil dibuat`, FrameService.name);
      return frame;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat Frame',
        error,
        FrameService.name,
      );
      throw error;
    }
  }

  async postCustomFrame(
    file: Express.Multer.File,
    data: CreateCustomFrameDto,
    user: RequestUser,
  ) {
    try {
      const key = `frames/${randomUUID()}-${file.originalname}`;

      const framePhoto = await this.frameRepository.createFrameObject(
        key,
        file.buffer,
        file.mimetype,
      );

      const url = framePhoto.url;

      const now = new Date();
      const payload = {
        ...data,
        code: `FRM-${generateId()}`,
        tenantId: user.tenantId,
        imagePath: url,
        frameType: 'CUSTOM',
        isActive: true,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        createdBy: user.sub,
        updatedBy: user.sub,
        createdAt: now,
        updatedAt: now,
      };

      const frame = await this.frameRepository.createFrameDB(payload);
      this.logger.log(`Custom Frame berhasil dibuat`, FrameService.name);
      return frame;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat Custom Frame',
        error,
        FrameService.name,
      );
      throw error;
    }
  }

  async getFrame() {
    try {
      const getAllPhoto = await this.frameRepository.getAllFrame();
      this.logger.log(`Frame berhasil diambil`, FrameService.name);
      return getAllPhoto;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat Frame',
        error,
        FrameService.name,
      );
      throw error;
    }
  }

  async getCustomFrame() {
    try {
      const getAllPhoto = await this.frameRepository.getAllCustomFrame();
      this.logger.log(`Custom Frame berhasil diambil`, FrameService.name);
      return getAllPhoto;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika mengambil Custom Frame',
        error,
        FrameService.name,
      );
      throw error;
    }
  }
}
