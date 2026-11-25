import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MidtransClient } from '../../shared/infra/midtrans/midtrans.client.js';
import { AppLogger } from '../../common/logger.service.js';
import { SessionRepository } from './session.repository.js';
import { RequestDevice } from '../../entity/requestUser.entity.js';
import { isUUID } from 'class-validator';
import type { SessionFiles, UploadItem } from '../../dto/session.dto.js';
import { createHash, randomBytes } from 'node:crypto';
import { StorageService } from '../../shared/infra/cloudflare/storage.service.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService {
  constructor(
    private readonly midtrans: MidtransClient,
    private readonly logger: AppLogger,
    private readonly sessionRepository: SessionRepository,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  async createSession(
    dto: any,
    id: string,
    device: RequestDevice,
    idempotencyKey: string,
  ) {
    if (!idempotencyKey || !isUUID(idempotencyKey))
      throw new BadRequestException('Idempotency-key must be a valid UUID');
    const { tenantId, boothId } = device;
    const byKey = await this.sessionRepository.findByIdempotencyKey(
      tenantId,
      boothId,
      idempotencyKey,
    );
    if (byKey) {
      if (byKey.paymentId !== id)
        throw new ConflictException(
          'Idempotency-Key was already used with different data',
        );
      return byKey;
    }
    const byPayment = await this.sessionRepository.findByPayment(
      tenantId,
      boothId,
      id,
    );
    if (byPayment) return byPayment;
    const getPayment = await this.sessionRepository.getPayment(
      id,
      device.boothId,
      device.tenantId,
    );
    if (!getPayment) throw new NotFoundException('Payment not found');
    if (getPayment.status !== 'PAID')
      throw new ConflictException('Payment is not paid');
    const getMidtransOrderId = await this.midtrans.getStatus(
      getPayment.midtransOrderId,
    );
    const {
      status,
      midtransOrderId,
      frameCanvasWidth,
      frameCanvasHeight,
      ...sessionData
    } = getPayment;
    if (
      getMidtransOrderId.transaction_status !== 'settlement' ||
      getPayment.status !== 'PAID'
    )
      throw new ConflictException('Payment was not paid');

    try {
      return await this.sessionRepository.createSession(
        tenantId,
        boothId,
        dto,
        idempotencyKey,
        sessionData,
      );
    } catch (e: any) {
      if ((e.cause ?? e).code === '23505') {
        const winner =
          (await this.sessionRepository.findByIdempotencyKey(
            tenantId,
            boothId,
            idempotencyKey,
          )) ??
          (await this.sessionRepository.findByPayment(tenantId, boothId, id));
        if (winner) return winner;
      }
      throw e;
    }
  }

  async updateSession(id: string, device: RequestDevice, files: SessionFiles) {
    const { tenantId, boothId } = device;
    const dataSession = await this.sessionRepository.getSessionById(
      id,
      tenantId,
      boothId,
    );

    if (!dataSession) throw new NotFoundException('Session not found');
    if (dataSession.status === 'FINISHED')
      throw new ConflictException('Session already finished');

    const prefix = dataSession.consentPublish ? 'public' : 'private';

    const items = this.buildItems(prefix, id, files, tenantId);

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    try {
      await Promise.all(
        items.map((i) =>
          this.storage.upload(i.key, i.file.buffer, i.file.mimetype),
        ),
      );
      await this.sessionRepository.finishSession(
        id,
        tenantId,
        boothId,
        tokenHash,
        items,
      );
    } catch (e) {
      // kalah balapan: file itu milik request pemenang, jangan dihapus
      if (!(e instanceof ConflictException)) {
        await this.storage
          .deleteMany(items.map((i) => i.key))
          .catch((err) =>
            this.logger.error(
              `Cleanup failed for session ${id}`,
              String(err),
              SessionService.name,
            ),
          );
      }
      throw e;
    }

    const base = this.config.getOrThrow<string>('DOWNLOAD_PAGE_URL');
    return { url: `${base}s/${token}` };
  }

  private buildItems(
    prefix: string,
    sessionId: string,
    files: SessionFiles,
    tenantId: string,
  ) {
    const base = `${prefix}/tenants/${tenantId}/${sessionId}`;
    const items: UploadItem[] = [];

    const framed = files.framed![0];
    items.push({
      kind: 'FRAMED',
      key: `${base}/framed.${this.ext(framed)}`,
      file: framed,
      position: 1,
    });

    files.photos!.forEach((file, index) => {
      items.push({
        kind: 'PHOTO',
        key: `${base}/photo-${index + 1}.${this.ext(file)}`,
        file,
        position: index + 2,
      });
    });

    const gif = files.gif![0];
    items.push({
      kind: 'GIF',
      key: `${base}/gif-combine.${this.ext(gif)}`,
      file: gif,
      position: items.length + 1,
    });

    const livePhotos = files.livePhoto![0];
    items.push({
      kind: 'LIVE_VIDEO',
      key: `${base}/live-photo.${this.ext(livePhotos)}`,
      file: livePhotos,
      position: items.length + 1,
    });

    return items;
  }

  private ext(file: Express.Multer.File) {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'video/mp4': 'mp4',
      'image/gif': 'gif',
    };
    return map[file.mimetype];
  }
}
