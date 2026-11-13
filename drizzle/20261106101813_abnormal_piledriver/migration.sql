CREATE SEQUENCE "public"."payment_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(100) DEFAULT 'TRX-' || nextval('payment_code_seq') NOT NULL,
	"tenant_id" uuid NOT NULL,
	"frame_id" uuid NOT NULL,
	"voucher_id" uuid,
	"booth_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"midtrans_order_id" varchar(50) NOT NULL UNIQUE,
	"sub_total" numeric(12,2),
	"discount_amount" numeric(12,2),
	"total_amount" numeric(12,2),
	"payment_status" varchar(50),
	"currency" varchar(5) DEFAULT 'IDR',
	"idempotency_key" text UNIQUE,
	"settlement_at" timestamp(0) with time zone,
	"created_at" timestamp(0) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_frame_id_frames_id_fkey" FOREIGN KEY ("frame_id") REFERENCES "frames"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_voucher_id_vouchers_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_booth_id_booths_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "booths"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;