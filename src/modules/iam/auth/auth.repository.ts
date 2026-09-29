import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { AppLogger } from '../../../common/logger.service.js';
import { User } from '../../../entity/user.entity.js';

export class AuthRepository {
  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
    private readonly logger: AppLogger,
  ) {}

  async findUser(tenantId: string, name: string) {
    const snapshot = await this.firestore
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .where('name', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) {
      this.logger.log(
        `User dengan nama "${name}" tidak ditemukan`,
        'UserRepository',
      );
      return null;
    }
    const doc = snapshot.docs[0];
    const data = doc.data();

    this.logger.log(
      `User dengan nama "${name}" ditemukan di Firestore`,
      'UserRepository',
    );
    return new User({
      id: doc.id,
      tenantId: data.tenantId,
      code: `USER`,
      name: data.name,
      password: data.password,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    });
  }
  async create(tenantId: string, userData: Partial<User>): Promise<User> {
    const now = new Date();
    const payload = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.firestore
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .add(payload);

    return new User({
      id: docRef.id,
      ...payload,
    });
  }
}
