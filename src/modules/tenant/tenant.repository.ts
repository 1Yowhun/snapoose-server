import { Injectable, Inject } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

@Injectable()
export class TenantRepository {
  constructor(@Inject('FIRESTORE') private readonly firestore: Firestore) {}

  async findById(tenantId: string) {
    const doc = await this.firestore.collection('tenants').doc(tenantId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }
}