import { Inject, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { Booth } from '../../entity/booth.entity.js';
import { DRIZZLE } from '../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  NewBooth,
  booths,
} from '../../shared/infra/database/schema/booth.schema.js';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { locations } from '../../shared/infra/database/schema/location.schema.js';
import { FilterBoothDto } from '../../dto/booth.dto.js';

export class BoothRepository {
  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
  ) {}

  // async create(locationId: string, data: Omit<Booth, 'id'>): Promise<Booth> {
  //   const docRef = await this.firestore
  //     .collection('locations')
  //     .doc(locationId)
  //     .collection('booths')
  //     .add(data);

  //   return new Booth({
  //     id: docRef.id,
  //     ...data,
  //   });
  // }
  // async findLocationById(id: string) {
  //   const doc = await this.firestore.collection('locations').doc(id).get();
  //   if (!doc.exists) return null;
  //   return { id: doc.id, ...doc.data() };
  // }

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

  async updateStatus(tenantId: string, id: string, isActive: boolean, userId: string) {
    const [row] = await this.db
      .update(booths)
      .set({ isActive, updatedBy: userId }) // updatedAt sudah ditangani $onUpdate
      .where(and(eq(booths.tenantId, tenantId), eq(booths.id, id)))
      .returning();
  
    if (!row) throw new NotFoundException('Booth tidak ditemukan');
    return row;
  }

  async getBoothList(tenantId: string, filter: FilterBoothDto) {
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

    const data = this.db
      .select()
      .from(booths)
      .where(and(...conditions))
      .orderBy(desc(booths.createdAt));

    return data;
  }
}
