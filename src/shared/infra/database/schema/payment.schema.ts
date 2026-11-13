import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  pgSequence,
  text,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { vouchers } from './voucher.schema.js';
import { frames } from './frame.schema.js';
import { booths } from './booth.schema.js';
import { products } from './product.schema.js';

export const PaymentCodeSeq = pgSequence('payment_code_seq', {
  startWith: 1,
  increment: 1,
});

export const payments = pgTable('payment', {
  // Primary Key menggunakan UUID secara otomatis
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 })
    .notNull()
    .default(sql`'TRX-' || nextval('payment_code_seq')`),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  frameId: uuid('frame_id')
    .notNull()
    .references(() => frames.id, {
      onDelete: 'cascade',
    }),
  voucherId: uuid('voucher_id').references(() => vouchers.id, {
    onDelete: 'cascade',
  }),
  boothId: uuid('booth_id')
    .notNull()
    .references(() => booths.id, {
      onDelete: 'cascade',
    }),
  product_id: uuid('product_id')
    .notNull()
    .references(() => products.id, {
      onDelete: 'cascade',
    }),
  midtransOrderId: varchar('midtrans_order_id', { length: 50 })
    .notNull()
    .unique(),
  subtotal: numeric('sub_total', { precision: 12, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  paymentStatus: varchar('payment_status', { length: 50 }),
  currency: varchar('currency', { length: 5 }).default('IDR'),
  idempotencyKey: text('idempotency_key').unique(),
  qrString: text('qr_string'),
  settlementAt: timestamp('settlement_at', {
    precision: 0,
    withTimezone: true,
  }),
  expiresAt: timestamp('expires_at', {
    precision: 0,
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// export type PaymentStatus =
//   | "UNPAID"
//   | "PENDING"
//   | "PAID"
//   | "FAILED"
//   | "EXPIRED";

// export type OrderStatus =
//   | "CREATED"
//   | "PENDING_PAYMENT"
//   | "READY"
//   | "IN_PROGRESS"
//   | "COMPLETED"
//   | "CANCELLED"
//   | "RECOVERY_REQUIRED";

// export interface OrderProductSnapshot {
//   productId: string;
//   name: string;
//   price: number;
//   quantity: number;
//   configuration?: Record<string, unknown>;
// }

// export interface Order {
//   id: string;
//   orderNumber: string;

//   boothId: string;

//   productSnapshot: OrderProductSnapshot[];

//   subtotal: number;
//   discountAmount: number;
//   totalAmount: number;
//   currency: "IDR";

//   voucherId: string | null;
//   voucherCode: string | null;

//   paymentStatus: PaymentStatus;
//   orderStatus: OrderStatus;

//   createdAt: Date;
//   updatedAt: Date;
// }