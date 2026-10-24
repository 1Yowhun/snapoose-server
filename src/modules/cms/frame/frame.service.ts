import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateCustomFrameDto,
  CreateFrameDto,
  FilterFrameDto,
} from '../../../dto/frame.dto.js';
import { FrameRepository } from './frame.repository.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { AppLogger } from '../../../common/logger.service.js';
import sharp from 'sharp';
import { NewFrame } from '../../../shared/infra/database/schema/frame.schema.js';

@Injectable()
export class FrameService {
  constructor(
    private readonly frameRepository: FrameRepository,
    private readonly logger: AppLogger,
  ) {}

  private async readImageSize(buffer: Buffer) {
    const metadata = await sharp(buffer)
      .metadata()
      .catch(() => {
        throw new BadRequestException('Invalid image file');
      });

    const { width, height } = metadata;

    if (!width || !height) {
      throw new BadRequestException(
        'Image width and height could not be determined',
      );
    }

    return { width, height };
  }

  async postNormalFrame(
    file: Express.Multer.File,
    data: CreateFrameDto,
    userId: string,
    tenantId: string,
  ) {
    const { boothIds, ...frameDetails } = data;
    const size = await this.readImageSize(file.buffer);
    const key = `frames/${randomUUID()}-${file.originalname}`;

    const framePhoto = await this.frameRepository.createFrameObject(
      key,
      file.buffer,
      file.mimetype,
    );

    const url = framePhoto.url;
    console.log(url);
    const payload: NewFrame = {
      ...frameDetails,
      tenantId: tenantId,
      canvasHeight: size.height,
      canvasWidth: size.width,
      overlayUrl: url,
      createdBy: userId,
      updatedBy: userId,
    };

    const frame = await this.frameRepository.createFrameDB(
      { ...payload },
      boothIds,
    );
    this.logger.log(
      `Frame created: frameId=${frame.id} tenantId=${tenantId} userId=${userId}`,
      FrameService.name,
    );
    return frame;
  }

  async postCustomFrame(
    file: Express.Multer.File,
    data: CreateCustomFrameDto,
    user: RequestUser,
  ) {
    const { boothIds, ...frameDetails } = data;
    const size = await this.readImageSize(file.buffer);
    const key = `frames/${randomUUID()}-${file.originalname}`;

    const framePhoto = await this.frameRepository.createFrameObject(
      key,
      file.buffer,
      file.mimetype,
    );

    const url = framePhoto.url;

    const payload = {
      ...frameDetails,
      tenantId: user.tenantId,
      overlayUrl: url,
      frameType: 'CUSTOM',
      canvasHeight: size.height,
      canvasWidth: size.width,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      createdBy: user.sub,
      updatedBy: user.sub,
    };

    const frame = await this.frameRepository.createFrameDB(
      { ...payload },
      boothIds,
    );
    this.logger.log(
      `Custom frame created: frameId=${frame.id} tenantId=${user.tenantId} userId=${user.sub}`,
      FrameService.name,
    );
    return frame;
  }

  async getFrame(tenantId: string, userId: string, filter: FilterFrameDto) {
    const getAllPhoto = await this.frameRepository.getAllFrame(
      tenantId,
      filter,
    );
    this.logger.debug(
      `Frames retrieved: tenantId=${tenantId} userId=${userId} count=${getAllPhoto.items.length}`,
      FrameService.name,
    );
    return getAllPhoto;
  }

  async getCustomFrame(
    tenantId: string,
    userId: string,
    filter: FilterFrameDto,
  ) {
    const getAllPhoto = await this.frameRepository.getAllCustomFrame(
      tenantId,
      filter,
    );
    this.logger.debug(
      `Custom frames retrieved: tenantId=${tenantId} userId=${userId} count=${getAllPhoto.items.length}`,
      FrameService.name,
    );
    return getAllPhoto;
  }

  async patchVoucherActive(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    const voucher = await this.frameRepository.getFrameById(tenantId, id);
    if (!voucher) throw new NotFoundException('Voucher not found');

    const voucherUpdate = await this.frameRepository.updateActive(
      tenantId,
      id,
      isActive,
      userId,
    );
    this.logger.log(
      `Frame status updated: voucherId=${id} tenantId=${tenantId} userId=${userId} isActive=${isActive}`,
      FrameService.name,
    );
    return voucherUpdate;
  }
}
