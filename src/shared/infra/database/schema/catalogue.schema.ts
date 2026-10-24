import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';

const syncColumn = (name: string) =>
  timestamp(name, { precision: 3, withTimezone: true }).notNull().defaultNow();

export const catalogues = pgTable('catalogues', {
  tenantId: uuid('tenant_id')
    .primaryKey()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  frameSync: syncColumn('frame_sync'),
  productSync: syncColumn('product_sync'),
  voucherSync: syncColumn('voucher_sync'),
});

export type SyncKey = 'frameSync' | 'productSync' | 'voucherSync';