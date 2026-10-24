import {
  ConflictException,
  HttpException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { DRIZZLE } from '../../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  NewVoucher,
  voucherBooths,
  vouchers,
} from '../../../shared/infra/database/schema/voucher.schema.js';
import { QuotaStatus, VoucherFilterDto } from '../../../dto/voucher.dto.js';
import {
  SQL,
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { catalogues } from '../../../shared/infra/database/schema/catalogue.schema.js';
import { booths } from '../../../shared/infra/database/schema/booth.schema.js';

export class VoucherRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async createVoucher(data: NewVoucher, boothIds: string[]) {
    const uniqueBoothIds = [...new Set(boothIds)];

    try {
      return await this.db.transaction(async (tx) => {
        if (uniqueBoothIds.length > 0) {
          const found = await tx
            .select({ id: booths.id })
            .from(booths)
            .where(
              and(
                inArray(booths.id, uniqueBoothIds),
                eq(booths.tenantId, data.tenantId),
              ),
            );
          if (found.length !== uniqueBoothIds.length) {
            throw new NotFoundException('Booth not found');
          }
        }

        const [newVoucher] = await tx.insert(vouchers).values(data).returning();

        if (uniqueBoothIds.length > 0) {
          await tx.insert(voucherBooths).values(
            uniqueBoothIds.map((boothId) => ({
              voucherId: newVoucher.id,
              boothId,
            })),
          );
        }
        await tx
          .insert(catalogues)
          .values({ tenantId: data.tenantId, voucherSync: sql`now()` })
          .onConflictDoUpdate({
            target: catalogues.tenantId,
            set: { voucherSync: sql`now()` },
          });

        return newVoucher;
      });
    } catch (e: any) {
      if (e instanceof HttpException) throw e;

      const err = e.cause ?? e;
      if (err.code === '23505') {
        throw new ConflictException('Voucher code already exists');
      }
      if (err.code === '23503') {
        throw new NotFoundException('Booth not found');
      }

      throw e;
    }
  }

  async getVoucher(tenantId: string, filter: VoucherFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    const remaining = sql<number>`(${vouchers.quota} - ${vouchers.usedCount})`;
    const conditions: (SQL | undefined)[] = [eq(vouchers.tenantId, tenantId)];

    if (filter.status?.length) {
      conditions.push(
        inArray(
          vouchers.isActive,
          filter.status.map((status) => status === 'active'),
        ),
      );
    }

    const available = or(isNull(vouchers.quota), gt(remaining, 0));
    const exhausted = and(isNotNull(vouchers.quota), lte(remaining, 0));

    if (filter.quotaStatus?.length) {
      const quotaConditions = [];

      if (filter.quotaStatus.includes(QuotaStatus.AVALIABLE)) {
        quotaConditions.push(available);
      }

      if (filter.quotaStatus.includes(QuotaStatus.EXHAUSTED)) {
        quotaConditions.push(exhausted);
      }

      if (quotaConditions.length > 0) {
        conditions.push(or(...quotaConditions));
      }
    }

    if (filter.remainingMin !== undefined) {
      conditions.push(gte(remaining, filter.remainingMin));
    }

    if (filter.remainingMax !== undefined) {
      conditions.push(lte(remaining, filter.remainingMax));
    }

    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(vouchers)
        .where(and(...conditions))
        .orderBy(desc(vouchers.createdAt), desc(vouchers.id))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(vouchers)
        .where(and(...conditions)),
    ]);
    const total = countRows[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getVoucherById(tenantId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.tenantId, tenantId), eq(vouchers.id, id)))
      .limit(1);
    return row ?? null;
  }

  async updateActive(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    await Promise.all([
      this.db
        .update(vouchers)
        .set({ isActive, updatedAt: new Date(), updatedBy: userId })
        .where(and(eq(vouchers.tenantId, tenantId), eq(vouchers.id, id))),
      this.db
        .insert(catalogues)
        .values({ tenantId: tenantId, voucherSync: sql`now()` })
        .onConflictDoUpdate({
          target: catalogues.tenantId,
          set: { voucherSync: sql`now()` },
        }),
    ]);
  }
}
