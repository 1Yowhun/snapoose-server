import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgSequence,
} from 'drizzle-orm/pg-core';

export const tenantCodeSeq = pgSequence('tenant_code_seq', {
  startWith: 1,
  increment: 1,
});

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 })
    .notNull()
    .unique()
    .default(sql`'TNT-' || nextval('tenant_code_seq')`),
  name: varchar('name', { length: 255 }).notNull(),
  brandName: varchar('brand_name', { length: 255 }).notNull(),
  about: text('about').notNull(),
  logoUrl: text('logo_url').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
