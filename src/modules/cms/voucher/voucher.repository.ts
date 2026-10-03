import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Firestore } from 'firebase-admin/firestore';
import { Voucher } from '../../../entity/voucher.entity.js';

export class VoucherRepository {
  constructor(@Inject('FIRESTORE') private readonly firestore: Firestore) {}

  async createVoucher(data: Omit<Voucher, 'id'>): Promise<Voucher> {
    const docRef = await this.firestore.collection('vouchers').add(data);
    return new Voucher({
      id: docRef.id,
      ...data,
    });
  }

  async findVoucherById(id: string): Promise<Voucher | null> {
    const doc = await this.firestore.collection('vouchers').doc(id).get();
    if (!doc.exists) return null;
    return new Voucher({
      id: doc.id,
      ...doc.data(),
    });
  }

  async updateVoucherById(
    id: string,
    data: Partial<Voucher>,
  ): Promise<Voucher> {
    const voucherRef = this.firestore.collection('vouchers').doc(id);

    await voucherRef.update({
      ...data,
      updatedAt: new Date(),
    });

    const updatedDoc = await voucherRef.get();

    return new Voucher({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  }

  async getAllVoucherList(): Promise<Voucher[]> {
    const snapshot = await this.firestore
      .collection('vouchers')
      .limit(20)
      .get();

    return snapshot.docs.map(
      (doc) =>
        new Voucher({
          id: doc.id,
          ...doc.data(),
        }),
    );
  }
}
