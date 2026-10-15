import { sql } from 'drizzle-orm';
import {
  boolean,
  pgSequence,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { locations } from './location.schema.js';
import { users } from './user.schema.js';

export const boothCodeSeq = pgSequence('booth_code_seq', {
  startWith: 1,
  increment: 1,
});
export const booths = pgTable('booths', {
  id: uuid('id').primaryKey().defaultRandom(),

  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  locationId: uuid('location_id')
    .notNull()
    .references(() => locations.id, { onDelete: 'cascade' }),

  code: varchar('code', { length: 100 })
    .notNull()
    .default(sql`'BTH-' || nextval('booth_code_seq')`),
  name: varchar('name', { length: 100 }).notNull(),
  serialNumber: varchar('serial_number', { length: 50 }).default(sql`NULL`),
  isActive: boolean('is_active').notNull().default(false),

  last_sync: timestamp('last_sync', {
    precision: 0,
    withTimezone: true,
  }).default(sql`NULL`),
  createdAt: timestamp('created_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  createdBy: uuid('created_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  updatedBy: uuid('updated_by').references(() => users.id, {
    onDelete: 'set null',
  }),
});

export type Booth = typeof booths.$inferSelect;
export type NewBooth = typeof booths.$inferInsert;
