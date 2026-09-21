import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class AppService {
  constructor(
    @Inject('FIRESTORE')
    private readonly firestore: Firestore,
  ) {}
  async createUser(name: string) {
    if (!name) {
      throw new BadRequestException('Query parameter "name" wajib diisi');
    }
    const userDoc = await this.firestore.collection('users').add({
      name: name,
      created_by: new Date(),
    });
    return { id: userDoc.id, name };
  }
}
