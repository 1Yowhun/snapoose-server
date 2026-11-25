import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { SessionRepository } from './session.repository.js';
import { StorageService } from '../../shared/infra/cloudflare/storage.service.js';

const INVALID_LINK = 'Link tidak valid atau sudah kedaluwarsa';

@Injectable()
export class PublicSessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly storage: StorageService,
  ) {}

  private async findSession(token: string) {
    // 32 byte base64url = 43 karakter; selain itu pasti bukan token kita
    if (!/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new NotFoundException(INVALID_LINK);

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session =
      await this.sessionRepository.findFinishedByTokenHash(tokenHash);
    if (!session) throw new NotFoundException(INVALID_LINK);

    return session;
  }

  async getGallery(token: string) {
    const session = await this.findSession(token);
    const rows = await this.sessionRepository.listMedia(session.id);

    const media = await Promise.all(
      rows.map(async (m) => ({
        id: m.id,
        kind: m.kind,
        contentType: m.contentType,
        filename: m.r2Key.split('/').pop(),
        sizeBytes: m.sizeBytes,
        position: m.position,
        previewUrl: await this.storage.getUrl(m.r2Key),
      })),
    );

    return { expiresAt: session.expiresAt, media };
  }

  async getDownloadUrl(token: string, mediaId: string) {
    const session = await this.findSession(token);
    const media = await this.sessionRepository.findMedia(mediaId, session.id);
    if (!media) throw new NotFoundException('Media not found');

    const filename = media.r2Key.split('/').pop() ?? 'download';
    return await this.storage.downloadUrl(media.r2Key, filename);
  }
}
