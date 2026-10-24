import { HttpException, Inject, NotFoundException } from '@nestjs/common';
import { R2_CLIENT } from '../../../shared/infra/cloudflare/r2.factory.js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import {
  Frame,
  NewFrame,
  frameBooths,
  frames,
} from '../../../shared/infra/database/schema/frame.schema.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../../shared/infra/database/drizzle.factory.js';
import { and, count, desc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import { FilterFrameDto } from '../../../dto/frame.dto.js';
import { PaginatedResult } from '../../../common/interface/pagination.interface.js';
import { booths } from '../../../shared/infra/database/schema/booth.schema.js';
import { catalogues } from '../../../shared/infra/database/schema/catalogue.schema.js';

export class FrameRepository {
  constructor(
    @Inject(R2_CLIENT) private readonly r2: S3Client,
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
    private readonly configService: ConfigService,
  ) {}

  async createFrameDB(data: NewFrame, boothIds: string[]) {
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
        const [newFrame] = await tx.insert(frames).values(data).returning();
        if (uniqueBoothIds.length > 0) {
          await tx.insert(frameBooths).values(
            uniqueBoothIds.map((boothId) => ({
              frameId: newFrame.id,
              boothId,
            })),
          );
        }
        await tx
          .insert(catalogues)
          .values({ tenantId: data.tenantId, frameSync: sql`now()` })
          .onConflictDoUpdate({
            target: catalogues.tenantId,
            set: { frameSync: sql`now()` },
          });

        return newFrame;
      });
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      const err = e.cause ?? e;
      if (err.code === '23503') throw new NotFoundException();
      throw e;
    }
  }

  async createFrameObject(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ key: string; etag?: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('R2_BUCKET_NAME'),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    const response = await this.r2.send(command);

    return {
      key,
      etag: response.ETag,
      url: `${this.configService.get('R2_PUBLIC_URL').trim()}${key}`,
    };
  }

  async getAllFrame(
    tenantId: string,
    filter: FilterFrameDto,
  ): Promise<PaginatedResult<Frame>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(frames)
        .where(
          and(eq(frames.tenantId, tenantId), ne(frames.frameType, 'CUSTOM')),
        )
        .orderBy(desc(frames.createdAt), desc(frames.id))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ total: count() })
        .from(frames)
        .where(
          and(eq(frames.tenantId, tenantId), ne(frames.frameType, 'CUSTOM')),
        ),
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

  async getAllCustomFrame(
    tenantId: string,
    filter: FilterFrameDto,
  ): Promise<PaginatedResult<Frame>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(frames)
        .where(
          and(
            eq(frames.tenantId, tenantId),
            eq(frames.frameType, 'CUSTOM'),
            isNotNull(frames.validUntil),
            isNotNull(frames.validFrom),
          ),
        )
        .orderBy(desc(frames.createdAt), desc(frames.id))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ total: count() })
        .from(frames)
        .where(
          and(
            eq(frames.tenantId, tenantId),
            eq(frames.frameType, 'CUSTOM'),
            isNotNull(frames.validUntil),
            isNotNull(frames.validFrom),
          ),
        ),
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

  async getFrameById(tenantId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(frames)
      .where(and(eq(frames.tenantId, tenantId), eq(frames.id, id)))
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
        .update(frames)
        .set({ isActive, updatedAt: new Date(), updatedBy: userId })
        .where(and(eq(frames.tenantId, tenantId), eq(frames.id, id))),
      this.db
        .insert(catalogues)
        .values({ tenantId: tenantId, frameSync: sql`now()` })
        .onConflictDoUpdate({
          target: catalogues.tenantId,
          set: { frameSync: sql`now()` },
        }),
    ]);
  }
}
