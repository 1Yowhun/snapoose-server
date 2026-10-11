CREATE SEQUENCE "public"."voucher_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"code" varchar(100) DEFAULT 'VCH-' || nextval('voucher_code_seq') NOT NULL,
	"voucher_code" varchar(50) NOT NULL,
	"discount_precent" integer,
	"quota" integer,
	"used_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT false NOT NULL,
	"valid_from" timestamp(0) with time zone,
	"valid_until" timestamp(0) with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_discount_range" CHECK ("discount_precent" BETWEEN 1 AND 100),
	CONSTRAINT "vouchers_used_within_quota" CHECK ("quota" IS NULL OR "used_count" <= "quota")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "vouchers_tenant_voucher_code_uq" ON "vouchers" ("tenant_id",UPPER("voucher_code"));--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;