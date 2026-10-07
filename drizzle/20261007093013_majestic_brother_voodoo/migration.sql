CREATE SEQUENCE "public"."location_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"code" varchar(100) DEFAULT 'LOK-' || nextval('location_code_seq') NOT NULL,
	"store_name" varchar(50) NOT NULL,
	"street" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"created_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(0) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;