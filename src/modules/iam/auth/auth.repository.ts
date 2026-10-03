import { ConflictException, Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { AppLogger } from '../../../common/logger.service.js';
import { User } from '../../../entity/user.entity.js';

export class AuthRepository {
  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
    private readonly logger: AppLogger,
  ) {}

  async findUser(tenantId: string, normalizedName: string) {
    const snapshot = await this.firestore
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .where('name', '==', normalizedName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      this.logger.log(
        `User dengan nama "${normalizedName}" tidak ditemukan`,
        'UserRepository',
      );
      return null;
    }
    const doc = snapshot.docs[0];
    const data = doc.data();

    this.logger.log(
      `User dengan nama "${normalizedName}" ditemukan di Firestore`,
      'UserRepository',
    );
    return new User({
      id: doc.id,
      tenantId: data.tenantId,
      code: data.code,
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
  async createUserWithUniqueName(
    tenantId: string,
    normalizedName: string,
    userData: Partial<User>,
  ): Promise<User> {
    const userRef = this.firestore
      .collection('tenants')
      .doc(tenantId)
      .collection('users');

    await this.firestore.runTransaction(async (tx) => {
      const usernameDoc = await tx.get(
        userRef.where('name', '==', normalizedName).limit(1),
      );

      if (!usernameDoc.empty) {
        throw new ConflictException(`Nama sudah terdaftar`);
      }

      tx.set(userRef.doc(), {
        ...userData,
        createdAt: new Date(),
      });
    });

    return new User({
      id: userRef.id,
      ...userData,
    });
  }
}
