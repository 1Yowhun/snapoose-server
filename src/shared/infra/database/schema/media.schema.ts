import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sessions } from './session.schema.js';

export const medias = pgTable(
  'media',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),

    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, {
        onDelete: 'cascade',
      }),
    kind: varchar('kind', { length: 20 }).notNull(),
    r2Key: text('r2_key').notNull().unique(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    position: smallint('position').notNull(),
    createdAt: timestamp('created_at', { precision: 0, withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('media_session_position_idx').on(t.sessionId, t.position),
    check(
      'media_kind_valid',
      sql`${t.kind} IN ('PHOTO','FRAMED','GIF','LIVE_VIDEO')`,
    ),
    check('media_size_positive', sql`${t.sizeBytes} > 0`),
  ],
);
export type Media = typeof medias.$inferSelect;
export type NewMedia = typeof medias.$inferInsert;
