CREATE SEQUENCE "public"."user_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."booth_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "booths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"code" varchar(100) DEFAULT 'BTH-' || nextval('location_code_seq') NOT NULL,
	"name" varchar(100) NOT NULL,
	"serial_number" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"installed_at" timestamp(0) with time zone,
	"created_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(0) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "code" SET DEFAULT 'USR-' || nextval('user_code_seq');--> statement-breakpoint
ALTER TABLE "booths" ADD CONSTRAINT "booths_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booths" ADD CONSTRAINT "booths_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;