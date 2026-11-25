import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
  numeric,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { booths } from './booth.schema.js';
import { SlotPoint, frames } from './frame.schema.js';
import { products } from './product.schema.js';
import { vouchers } from './voucher.schema.js';
import { payments } from './payment.schema.js';

export const SessionCodeSeq = pgSequence('session_code_seq', {
  startWith: 1,
  increment: 1,
});

export const sessions = pgTable(
  'session',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    code: varchar('code', { length: 100 })
      .notNull()
      .default(sql`'SES-' || nextval('session_code_seq')`),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    boothId: uuid('booth_id')
      .notNull()
      .references(() => booths.id, {
        onDelete: 'cascade',
      }),
    frameId: uuid('frame_id')
      .notNull()
      .references(() => frames.id, {
        onDelete: 'cascade',
      }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, {
        onDelete: 'cascade',
      }),
    voucherId: uuid('voucher_id').references(() => vouchers.id, {
      onDelete: 'cascade',
    }),
    paymentId: uuid('payment_id')
      .notNull()
      .unique()
      .references(() => payments.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 20 }).notNull().default('STARTED'),
    consentPublish: boolean('consent_publish'),
    productNameSnapshot: varchar('product_name_snapshot', { length: 50 }),
    productPriceSnapshot: numeric('product_price_snapshot', {
      precision: 12,
      scale: 2,
    }),
    productDiscountSnapshot: numeric('product_discount_snapshot', {
      precision: 12,
      scale: 2,
    }),
    layoutMappingJson: jsonb('layout_mapping_json')
      .$type<SlotPoint[]>()
      .default([]),
    idempotencyKey: text('idempotency_key').unique(),
    downloadTokenHash: varchar('download_token_hash', { length: 64 }).unique(),
    createdAt: timestamp('created_at', { precision: 0, withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { precision: 0, withTimezone: true }),
    completedAt: timestamp('completed_at', {
      precision: 0,
      withTimezone: true,
    }),
  },
  (t) => [
    // check hanya bisa status, started,capturing dan uploading, dst
    check('session_status_valid', sql`${t.status} IN ('STARTED','FINISHED')`),

    // indexing query data berdasarakan filter booth dan order by createdat asc or desc
    index('session_booth_created_idx').on(t.boothId, t.createdAt),

    // bakal buat index expire_at ketika status completed dan ada time stamp berarti consentPublish false
    index('session_expires_idx')
      .on(t.expiresAt)
      .where(sql`${t.status} = 'FINISHED' AND ${t.expiresAt} IS NOT NULL`),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
