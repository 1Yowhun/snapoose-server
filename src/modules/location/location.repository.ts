import { Inject, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { Location } from '../../entity/location.entity.js';

export class LocationRepository {
  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
  ) {}

  async create(data: Omit<Location, 'id'>): Promise<Location> {
    const docRef = await this.firestore.collection('locations').add(data);
    return new Location({
      id: docRef.id,
      ...data,
    });
  }

  async getLocationData(): Promise<Location[]> {
    const snapshot = await this.firestore
      .collection('locations')
      .limit(15)
      .get();

    return snapshot.docs.map(
      (doc) => new Location({ id: doc.id, ...doc.data() }),
    );
  }
}
