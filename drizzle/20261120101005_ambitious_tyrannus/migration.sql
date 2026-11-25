CREATE SEQUENCE "public"."session_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"session_id" uuid NOT NULL,
	"kind" varchar(20) NOT NULL,
	"r2_key" text NOT NULL UNIQUE,
	"content_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"position" smallint NOT NULL,
	"created_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_kind_valid" CHECK ("kind" IN ('PHOTO','FRAMED','GIF','LIVE_VIDEO')),
	CONSTRAINT "media_size_positive" CHECK ("size_bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"code" varchar(100) DEFAULT 'SES-' || nextval('session_code_seq') NOT NULL,
	"tenant_id" uuid NOT NULL,
	"booth_id" uuid NOT NULL,
	"frame_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"voucher_id" uuid,
	"payment_id" uuid NOT NULL UNIQUE,
	"status" varchar(20) DEFAULT 'STARTED' NOT NULL,
	"consent_publish" boolean,
	"product_name_snapshot" varchar(50),
	"product_price_snapshot" numeric(12,2),
	"product_discount_snapshot" numeric(12,2),
	"layout_mapping_json" jsonb DEFAULT '[]',
	"idempotency_key" text UNIQUE,
	"download_token_hash" varchar(64) UNIQUE,
	"created_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp(0) with time zone,
	"completed_at" timestamp(0) with time zone,
	CONSTRAINT "session_status_valid" CHECK ("status" IN ('STARTED','CAPTURING','UPLOADING','COMPLETED','FAILED','RECOVERY_REQUIRED','EXPIRED'))
);
--> statement-breakpoint
CREATE INDEX "media_session_position_idx" ON "media" ("session_id","position");--> statement-breakpoint
CREATE INDEX "session_booth_created_idx" ON "session" ("booth_id","created_at");--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "session" ("expires_at") WHERE "status" = 'COMPLETED' AND "expires_at" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_session_id_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_booth_id_booths_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "booths"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_frame_id_frames_id_fkey" FOREIGN KEY ("frame_id") REFERENCES "frames"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_voucher_id_vouchers_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT;