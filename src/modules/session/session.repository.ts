import { ConflictException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { payments } from '../../shared/infra/database/schema/payment.schema.js';
import { and, asc, eq, gt, isNull, or } from 'drizzle-orm';
import { frames } from '../../shared/infra/database/schema/frame.schema.js';
import { products } from '../../shared/infra/database/schema/product.schema.js';
import { vouchers } from '../../shared/infra/database/schema/voucher.schema.js';
import {
  NewSession,
  sessions,
} from '../../shared/infra/database/schema/session.schema.js';
import { medias } from '../../shared/infra/database/schema/media.schema.js';

export type CreateSessionInput = Omit<
  NewSession,
  'id' | 'tenantId' | 'boothId' | 'consentPublish' | 'expiresAt' | 'createdAt'
>;
export class SessionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
    boothId: string,
  ) {
    const [data] = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.tenantId, tenantId),
          eq(sessions.idempotencyKey, idempotencyKey),
          eq(sessions.boothId, boothId),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async findByPayment(tenantId: string, boothId: string, paymentId: string) {
    const [data] = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.paymentId, paymentId),
          eq(sessions.tenantId, tenantId),
          eq(sessions.boothId, boothId),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async getPayment(id: string, boothId: string, tenantId: string) {
    const [data] = await this.db
      .select({
        frameId: payments.frameId,
        productId: payments.productId,
        voucherId: payments.voucherId,
        paymentId: payments.id,
        productNameSnapshot: products.name,
        productPriceSnapshot: payments.totalAmount,
        productDiscountSnapshot: payments.discountAmount,
        layoutMappingJson: frames.slots,
        status: payments.paymentStatus,
        midtransOrderId: payments.midtransOrderId,
        frameCanvasWidth: frames.canvasWidth,
        frameCanvasHeight: frames.canvasHeight,
      })
      .from(payments)
      .innerJoin(products, eq(products.id, payments.productId))
      .innerJoin(frames, eq(frames.id, payments.frameId))
      .where(
        and(
          eq(payments.id, id),
          eq(payments.boothId, boothId),
          eq(payments.tenantId, tenantId),
        ),
      )
      .limit(1);
    return data ?? null;
  }

  async createSession(
    tenantId: string,
    boothId: string,
    consentPublish: boolean,
    key: string,
    data: CreateSessionInput,
  ) {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = consentPublish
      ? null
      : new Date(Date.now() + SEVEN_DAYS_MS);
    const [created] = await this.db
      .insert(sessions)
      .values({
        ...data,
        idempotencyKey: key,
        tenantId,
        boothId,
        consentPublish,
        expiresAt,
      })
      .returning();

    return created;
  }

  async getSessionById(id: string, tenantId: string, boothId: string) {
    const [data] = await this.db
      .select({
        id: sessions.id,
        status: sessions.status,
        consentPublish: sessions.consentPublish,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.id, id),
          eq(sessions.tenantId, tenantId),
          eq(sessions.boothId, boothId),
        ),
      );

    return data ?? null;
  }

  async finishSession(
    id: string,
    tenantId: string,
    boothId: string,
    tokenHash: string,
    items: {
      kind: string;
      key: string;
      file: Express.Multer.File;
      position: number;
    }[],
  ) {
    return await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(sessions)
        .set({
          status: 'FINISHED',
          completedAt: new Date(),
          downloadTokenHash: tokenHash,
        })
        .where(
          and(
            eq(sessions.id, id),
            eq(sessions.tenantId, tenantId),
            eq(sessions.boothId, boothId),
            eq(sessions.status, 'STARTED'),
          ),
        )
        .returning({ id: sessions.id });

      if (!updated) throw new ConflictException('Session already finished');

      await tx.insert(medias).values(
        items.map((item) => ({
          sessionId: updated.id,
          kind: item.kind,
          r2Key: item.key,
          contentType: item.file.mimetype,
          sizeBytes: item.file.size,
          position: item.position,
        })),
      );
    });
  }

  // Dipakai endpoint publik: token valid, sesi selesai, dan belum kedaluwarsa.
  async findFinishedByTokenHash(tokenHash: string) {
    const [data] = await this.db
      .select({ id: sessions.id, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(
        and(
          eq(sessions.downloadTokenHash, tokenHash),
          eq(sessions.status, 'FINISHED'),
          or(isNull(sessions.expiresAt), gt(sessions.expiresAt, new Date())),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async listMedia(sessionId: string) {
    return await this.db
      .select()
      .from(medias)
      .where(eq(medias.sessionId, sessionId))
      .orderBy(asc(medias.position));
  }

  // Wajib memfilter sessionId supaya token sesi A tidak bisa mengambil media sesi B.
  async findMedia(mediaId: string, sessionId: string) {
    const [data] = await this.db
      .select()
      .from(medias)
      .where(and(eq(medias.id, mediaId), eq(medias.sessionId, sessionId)))
      .limit(1);

    return data ?? null;
  }
}
