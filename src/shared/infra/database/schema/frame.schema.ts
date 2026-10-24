import {
  pgTable,
  varchar,
  integer,
  text,
  jsonb,
  uuid,
  pgSequence,
  timestamp,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { sql } from 'drizzle-orm';
import { users } from './user.schema.js';
import { booths } from './booth.schema.js';
export const frameCodeSeq = pgSequence('frame_code_seq', {
  startWith: 1,
  increment: 1,
});
type SlotPoint = { x: number; y: number; width: number; height: number };

export const frames = pgTable('frames', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 100 })
    .notNull()
    .default(sql`'FRM-' || nextval('frame_code_seq')`),
  name: varchar('name', { length: 255 }).notNull(),
  frameType: varchar('frame_type', { length: 100 }).notNull(),
  canvasWidth: integer('canvas_width').notNull(),
  canvasHeight: integer('canvas_height').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  overlayUrl: text('overlay_url').notNull(),
  slots: jsonb('slots').$type<SlotPoint[]>().notNull().default([]),
  validFrom: timestamp('valid_from', { precision: 0, withTimezone: true }),
  validUntil: timestamp('valid_untill', {
    precision: 0,
    withTimezone: true,
  }),
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

export const frameBooths = pgTable(
  'frame_booths',
  {
    frameId: uuid('frame_id')
      .notNull()
      .references(() => frames.id, { onDelete: 'cascade' }),
    boothId: uuid('booth_id')
      .notNull()
      .references(() => booths.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.frameId, t.boothId] })],
);

export type Frame = typeof frames.$inferSelect;
export type NewFrame = typeof frames.$inferInsert;
