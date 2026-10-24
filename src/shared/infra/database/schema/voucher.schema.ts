import {
  boolean,
  check,
  decimal,
  integer,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { sql } from 'drizzle-orm';
import { users } from './user.schema.js';
import { booths } from './booth.schema.js';

export const voucherCodeSeq = pgSequence('voucher_code_seq', {
  startWith: 1,
  increment: 1,
});

export const vouchers = pgTable(
  'vouchers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    code: varchar('code', { length: 100 })
      .notNull()
      .default(sql`'VCH-' || nextval('voucher_code_seq')`),
    voucherCode: varchar('voucher_code', { length: 50 }).notNull(),
    discountPercent: decimal('discount_percent', {
      precision: 5,
      scale: 2,
      mode: 'number',
    }).notNull(),
    quota: integer('quota'),
    usedCount: integer('used_count').default(0).notNull(),
    isActive: boolean('is_active').notNull().default(false),

    validFrom: timestamp('valid_from', { precision: 0, withTimezone: true }),
    validUntil: timestamp('valid_until', { precision: 0, withTimezone: true }),

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
  },
  (t) => [
    uniqueIndex('vouchers_tenant_voucher_code_uq').on(
      t.tenantId,
      sql`UPPER(${t.voucherCode})`,
    ),
    check(
      'vouchers_discount_range',
      sql`${t.discountPercent} BETWEEN 1 AND 100`,
    ),
    check(
      'vouchers_used_within_quota',
      sql`${t.quota} IS NULL OR ${t.usedCount} <= ${t.quota}`,
    ),
  ],
);

export const voucherBooths = pgTable(
  'voucher_booths',
  {
    voucherId: uuid('voucher_id')
      .notNull()
      .references(() => vouchers.id, { onDelete: 'cascade' }),
    boothId: uuid('booth_id')
      .notNull()
      .references(() => booths.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.voucherId, t.boothId] })],
);

export type Voucher = typeof vouchers.$inferSelect;
export type NewVoucher = typeof vouchers.$inferInsert;
