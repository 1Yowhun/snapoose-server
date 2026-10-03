import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { Product } from '../../../entity/product.entity.js';

export class ProductRepository {
  constructor(@Inject('FIRESTORE') private readonly firestore: Firestore) {}

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    const docRef = await this.firestore.collection('products').add(data);
    return new Product({
      id: docRef.id,
      ...data,
    });
  }

  async getAllProductList(): Promise<Product[]> {
    const snapshot = await this.firestore
      .collection('products')
      .limit(20)
      .get();

    return snapshot.docs.map(
      (doc) =>
        new Product({
          id: doc.id,
          ...doc.data(),
        }),
    );
  }
}
