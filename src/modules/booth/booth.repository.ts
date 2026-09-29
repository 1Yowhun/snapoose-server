import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { Booth } from '../../entity/booth.entity.js';

export class BoothRepository {
  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
  ) {}

  async create(locationId: string, data: Omit<Booth, 'id'>): Promise<Booth> {
    const docRef = await this.firestore
      .collection('locations')
      .doc(locationId)
      .collection('booths')
      .add(data);

    return new Booth({
      id: docRef.id,
      ...data,
    });
  }
  async findLocationById(id: string) {
    const doc = await this.firestore.collection('locations').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }
}
