CREATE SEQUENCE "public"."tenant_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "updated_at" timestamp(0) with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp(0) with time zone USING "created_at"::timestamp(0) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(0) with time zone USING "updated_at"::timestamp(0) with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "code" SET DEFAULT 'TNT-' || nextval('tenant_code_seq');--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "created_at" SET DATA TYPE timestamp(0) with time zone USING "created_at"::timestamp(0) with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_code_key" UNIQUE("code");