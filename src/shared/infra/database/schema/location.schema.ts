import {
  boolean,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { sql } from 'drizzle-orm';
import { users } from './user.schema.js';

export const locationCodeSeq = pgSequence('location_code_seq', {
  startWith: 1,
  increment: 1,
});

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),

  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  code: varchar('code', { length: 100 })
    .notNull()
    .default(sql`'LOK-' || nextval('location_code_seq')`),
  storeName: varchar('store_name', { length: 50 }).notNull(),
  street: text('street'),
  isActive: boolean('is_active').notNull().default(false),

  createdBy: uuid('created_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  updatedBy: uuid('updated_by').references(() => users.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
    
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
