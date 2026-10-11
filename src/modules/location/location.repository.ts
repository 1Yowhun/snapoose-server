import { Inject, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import {
  locations,
  NewLocation,
  Location as LocationDrizzle,
} from '../../shared/infra/database/schema/location.schema.js';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq } from 'drizzle-orm';

export class LocationRepository {
  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
  ) {}

  async create(data: NewLocation) {
    return await this.db.insert(locations).values(data);
  }

  async getLocationData(tenantId: string): Promise<LocationDrizzle[]> {
    const locationList = await this.db
      .select()
      .from(locations)
      .where(eq(locations.tenantId, tenantId))
      .limit(20);
    return locationList;
  }

  async findById(tenantId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(locations)
      .where(and(eq(locations.tenantId, tenantId), eq(locations.id, id)))
      .limit(1);
    return row ?? null;
  }

  async updateActive(tenantId: string, id: string, isActive: boolean) {
    await this.db
      .update(locations)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(locations.tenantId, tenantId), eq(locations.id, id)));
  }

  async getNameId(tenantId: string) {
    return await this.db.select({
      id: locations.id,
      storeName: locations.storeName
    }).from(locations)
    .where(and(eq(locations.tenantId, tenantId), eq(locations.isActive, true)))
    .orderBy(asc(locations.storeName));
  }
}
