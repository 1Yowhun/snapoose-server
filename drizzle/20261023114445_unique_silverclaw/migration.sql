CREATE TABLE "catalogues" (
	"tenant_id" uuid PRIMARY KEY,
	"frame_sync" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"product_sync" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"voucher_sync" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_location_id_locations_id_fkey";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "location_id";--> statement-breakpoint
ALTER TABLE "catalogues" ADD CONSTRAINT "catalogues_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;