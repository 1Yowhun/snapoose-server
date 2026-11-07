import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid, // <-- Gunakan uuid
  integer,
  varchar,
  numeric,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';

export const transactions = pgTable('transaction', {
  // Primary Key menggunakan UUID secara otomatis
  id: uuid('id').primaryKey().defaultRandom(),

  // Identifiers
  code: varchar('code', { length: 100 })
    .notNull()
    .default(sql`'TRX-' || nextval('product_code_seq')`),

  // Foreign Keys
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  sessionId: integer('session_id'),
  voucherId: integer('voucher_id'),

  transactionType: varchar('transaction_type', { length: 50 }),
  merchantNameSnapshot: varchar('merchant_name_snapshot', { length: 255 }),

  grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }),

  // Status & Gateway Info
  gatewayStatus: varchar('gateway_status', { length: 50 }),
  status: varchar('status', { length: 50 }),
  midtransOrderId: varchar('midtrans_order_id', { length: 255 }),

  // Flags & Webhook Safety
  isOfflineCreated: boolean('is_offline_created').default(false),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),

  // Timestamps
  paidAt: timestamp('paid_at'),
  settlementAt: timestamp('settlement_at'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at', { precision: 0, withTimezone: true })
    .notNull()
    .defaultNow(),
});


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