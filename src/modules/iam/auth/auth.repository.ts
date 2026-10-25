import { ConflictException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  users,
  type NewUser,
  type User as UserDrizzle,
} from '../../../shared/infra/database/schema/user.schema.js';
import { eq } from 'drizzle-orm';

export class AuthRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
  ) {}

  async createUser(userData: NewUser): Promise<UserDrizzle> {
    const [user] = await this.db.insert(users).values(userData).returning();
    return user;
  }

  async findByName(name: string) {
    const [row] = await this.db
      .select({
        id: users.id,
        name: users.name,
        code: users.code,
        tenantId: users.tenantId,
        password: users.password,
      })
      .from(users)
      .where(eq(users.name, name))
      .limit(1);
    return row ?? null;
  }
}
