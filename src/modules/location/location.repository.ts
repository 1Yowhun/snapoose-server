import { Inject } from '@nestjs/common';
import {
  locations,
  NewLocation,
  Location as LocationDrizzle,
} from '../../shared/infra/database/schema/location.schema.js';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { FilterLocationDto } from '../../dto/location.dto.js';
import { PaginatedResult } from '../../common/interface/pagination.interface.js';

export class LocationRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
  ) {}

  async create(data: NewLocation) {
    return await this.db.insert(locations).values(data);
  }

  async getLocationData(
    tenantId: string,
    filter: FilterLocationDto,
  ): Promise<PaginatedResult<LocationDrizzle>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const condition = eq(locations.tenantId, tenantId);

    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(locations)
        .where(condition)
        .orderBy(desc(locations.createdAt), desc(locations.id))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(locations).where(condition),
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

  async findById(tenantId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(locations)
      .where(and(eq(locations.tenantId, tenantId), eq(locations.id, id)))
      .limit(1);
    return row ?? null;
  }

  async updateActive(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    await this.db
      .update(locations)
      .set({ isActive, updatedAt: new Date(), updatedBy: userId })
      .where(and(eq(locations.tenantId, tenantId), eq(locations.id, id)));
  }

  async getNameId(tenantId: string) {
    return await this.db
      .select({
        id: locations.id,
        storeName: locations.storeName,
      })
      .from(locations)
      .where(
        and(eq(locations.tenantId, tenantId), eq(locations.isActive, true)),
      )
      .orderBy(asc(locations.storeName));
  }
}
