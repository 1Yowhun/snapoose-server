import { drizzle } from 'drizzle-orm/node-postgres';
import { defineRelations } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema/index.js';
import { ConfigService } from '@nestjs/config';

export const DRIZZLE = 'DRIZZLE';

export const drizzleFactory = (configService: ConfigService) => {
  const connectionString = configService.get<string>('DATABASE_URL');

  if (!connectionString) {
    throw new Error('database url tidak ditemukan di file .env!');
  }

  const pool = new Pool({
    connectionString,
    max: 10,
  });

  return drizzle({
    client: pool,
    relations: defineRelations(schema),
  });
};