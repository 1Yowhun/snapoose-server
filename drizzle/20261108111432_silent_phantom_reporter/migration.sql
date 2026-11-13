ALTER TABLE "payment" ADD COLUMN "qr_string" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "expires_at" timestamp(0) with time zone;