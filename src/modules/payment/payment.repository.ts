import { Inject } from '@nestjs/common';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  NewPayment,
  Payment,
  payments,
} from '../../shared/infra/database/schema/payment.schema.js';
import { and, eq, gte, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  productBooths,
  products,
} from '../../shared/infra/database/schema/product.schema.js';
import {
  frameBooths,
  frames,
} from '../../shared/infra/database/schema/frame.schema.js';
import {
  voucherBooths,
  vouchers,
} from '../../shared/infra/database/schema/voucher.schema.js';

const paymentResponse = {
  id: payments.id,
  midtransOrderId: payments.midtransOrderId,
  productId: payments.product_id,
  frameId: payments.frameId,
  voucherId: payments.voucherId,
  subtotal: payments.subtotal,
  discountAmount: payments.discountAmount,
  totalAmount: payments.totalAmount,
  paymentStatus: payments.paymentStatus,
  qrString: payments.qrString,
  expiresAt: payments.expiresAt,
};

export type PaymentResponse = Pick<
  Payment,
  | 'id'
  | 'midtransOrderId'
  | 'frameId'
  | 'voucherId'
  | 'subtotal'
  | 'discountAmount'
  | 'totalAmount'
  | 'paymentStatus'
  | 'qrString'
  | 'expiresAt'
> & {
  productId: Payment['product_id'];
};

// Catalogue dianggap tersedia jika sekarang berada di dalam periode berlakunya
const withinPeriod = (validFrom: AnyPgColumn, validUntil: AnyPgColumn) =>
  and(
    or(isNull(validFrom), lte(validFrom, sql`now()`)),
    or(isNull(validUntil), gte(validUntil, sql`now()`)),
  );

export class PaymentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
    boothId: string,
  ) {
    const [data] = await this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.idempotencyKey, idempotencyKey),
          eq(payments.boothId, boothId),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async findProduct(tenantId: string, boothId: string, productId: string) {
    const [data] = await this.db
      .select({ id: products.id, name: products.name, price: products.price })
      .from(products)
      .innerJoin(
        productBooths,
        and(
          eq(productBooths.productId, products.id),
          eq(productBooths.boothId, boothId),
        ),
      )
      .where(
        and(
          eq(products.id, productId),
          eq(products.tenantId, tenantId),
          eq(products.isActive, true),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async findFrame(tenantId: string, boothId: string, frameId: string) {
    const [data] = await this.db
      .select({
        id: frames.id,
        name: frames.name,
        url: frames.overlayUrl,
        slots: frames.slots,
      })
      .from(frames)
      .innerJoin(
        frameBooths,
        and(
          eq(frameBooths.frameId, frames.id),
          eq(frameBooths.boothId, boothId),
        ),
      )
      .where(
        and(
          eq(frames.id, frameId),
          eq(frames.tenantId, tenantId),
          eq(frames.isActive, true),
          //   withinPeriod(frames.validFrom, frames.validUntil),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async findVoucher(tenantId: string, boothId: string, voucherId: string) {
    const [data] = await this.db
      .select({
        id: vouchers.id,
        voucherCode: vouchers.voucherCode,
        discountPercent: vouchers.discountPercent,
      })
      .from(vouchers)
      .innerJoin(
        voucherBooths,
        and(
          eq(voucherBooths.voucherId, vouchers.id),
          eq(voucherBooths.boothId, boothId),
        ),
      )
      .where(
        and(
          eq(vouchers.id, voucherId),
          eq(vouchers.tenantId, tenantId),
          eq(vouchers.isActive, true),
          withinPeriod(vouchers.validFrom, vouchers.validUntil),
          or(isNull(vouchers.quota), lt(vouchers.usedCount, vouchers.quota)),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async createPending(
    data: Omit<
      NewPayment,
      | 'subtotal'
      | 'discountAmount'
      | 'totalAmount'
      | 'paymentStatus'
      | 'settlementAt'
    >,
    subtotal: number,
  ) {
    return this.db.transaction(async (tx) => {
      let discount = 0;
      if (data.voucherId) {
        const [reserved] = await tx
          .update(vouchers)
          .set({ usedCount: sql`${vouchers.usedCount} + 1` })
          .where(
            and(
              eq(vouchers.id, data.voucherId),
              eq(vouchers.isActive, true),
              withinPeriod(vouchers.validFrom, vouchers.validUntil),
              or(
                isNull(vouchers.quota),
                lt(vouchers.usedCount, vouchers.quota),
              ),
            ),
          )
          .returning({ discountPercent: vouchers.discountPercent });
        if (!reserved) return null;
        discount = Math.floor((subtotal * reserved.discountPercent) / 100);
      }
      const total = subtotal - discount;

      const [payment] = await tx
        .insert(payments)
        .values({
          ...data,
          subtotal: subtotal.toString(),
          discountAmount: discount.toString(),
          totalAmount: total.toString(),
          // Voucher 100% tidak perlu ke Midtrans
          paymentStatus: total === 0 ? 'PAID' : 'PENDING',
          settlementAt: total === 0 ? new Date() : null,
        })
        .returning(paymentResponse);
      return payment;
    });
  }

  async findByMidtransOrderId(orderId: string) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.midtransOrderId, orderId))
      .limit(1);

    return payment ?? null;
  }

  async saveQr(id: string, qrString: string, expiresAt: Date) {
    const [data] = await this.db
      .update(payments)
      .set({ qrString, expiresAt })
      .where(and(eq(payments.id, id), eq(payments.paymentStatus, 'PENDING')))
      .returning(paymentResponse);

    return data ?? null;
  }
  async markPaid(id: string) {
    const [data] = await this.db
      .update(payments)
      .set({ paymentStatus: 'PAID', settlementAt: new Date() })
      .where(and(eq(payments.id, id), eq(payments.paymentStatus, 'PENDING')))
      .returning(paymentResponse);

    return data ?? null;
  }
  async markFailed(id: string, status: 'EXPIRED' | 'FAILED') {
    return this.db.transaction(async (tx) => {
      const [data] = await tx
        .update(payments)
        .set({ paymentStatus: status })
        .where(and(eq(payments.id, id), eq(payments.paymentStatus, 'PENDING')))
        .returning({ ...paymentResponse });
      if (!data) return null; // sudah diproses sebelumnya

      if (data.voucherId) {
        await tx
          .update(vouchers)
          .set({ usedCount: sql`GREATEST(${vouchers.usedCount} - 1, 0)` })
          .where(eq(vouchers.id, data.voucherId));
      }
      return data;
    });
  }

  async findById(id: string) {
    const [data] = await this.db
      .select(paymentResponse)
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    return data ?? null;
  }

  // Payment hanya bisa dibaca oleh booth yang membuatnya
  async findForDevice(id: string, tenantId: string, boothId: string) {
    const [data] = await this.db
      .select(paymentResponse)
      .from(payments)
      .where(
        and(
          eq(payments.id, id),
          eq(payments.tenantId, tenantId),
          eq(payments.boothId, boothId),
        ),
      )
      .limit(1);

    return data ?? null;
  }
}
