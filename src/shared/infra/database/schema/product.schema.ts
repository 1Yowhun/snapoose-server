import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  decimal,
  boolean,
  pgSequence,
  uuid,
  timestamp,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema.js';
import { tenants } from './tenant.schema.js';
import { sql } from 'drizzle-orm';
import { locations } from './location.schema.js';
import { booths } from './booth.schema.js';

export const productCodeSeq = pgSequence('product_code_seq', {
  startWith: 1,
  increment: 1,
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  code: varchar('code', { length: 100 })
    .notNull()
    .default(sql`'PRD-' || nextval('product_code_seq')`),
  name: varchar('name', { length: 100 }).notNull(),
  price: numeric('price', {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .$type<number>(),
  includedPrintQuantity: integer('included_print_quantity')
    .notNull()
    .default(2),
  isActive: boolean('is_active').notNull().default(true),
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

export const productBooths = pgTable(
  'product_booths',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    boothId: uuid('booth_id')
      .notNull()
      .references(() => booths.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.boothId] })],
);

// Type Inferences
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
