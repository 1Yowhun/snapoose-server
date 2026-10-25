import { Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  Booth,
  NewBooth,
  booths,
} from '../../shared/infra/database/schema/booth.schema.js';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { locations } from '../../shared/infra/database/schema/location.schema.js';
import { FilterBoothDto } from '../../dto/booth.dto.js';
import { PaginatedResult } from '../../common/interface/pagination.interface.js';

export class BoothRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async findLocationById(id: string, tenantId: string) {
    const [data] = await this.db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.id, id),
          eq(locations.tenantId, tenantId),
          eq(locations.isActive, true),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async create(data: NewBooth) {
    return await this.db.insert(booths).values(data);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    const [row] = await this.db
      .update(booths)
      .set({ isActive, updatedBy: userId }) // updatedAt sudah ditangani $onUpdate
      .where(and(eq(booths.tenantId, tenantId), eq(booths.id, id)))
      .returning();

    if (!row) throw new NotFoundException('Booth not found');
    return row;
  }

  async getBoothList(
    tenantId: string,
    filter: FilterBoothDto,
  ): Promise<PaginatedResult<Booth>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    const conditions = [eq(booths.tenantId, tenantId)];

    if (filter.locationIds?.length) {
      conditions.push(inArray(booths.locationId, filter.locationIds));
    }
    if (filter.statuses?.length) {
      conditions.push(
        inArray(
          booths.isActive,
          filter.statuses.map((s) => s === 'active'),
        ),
      );
    }

    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(booths)
        .where(and(...conditions))
        .orderBy(desc(booths.createdAt), desc(booths.id))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(booths)
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
}
