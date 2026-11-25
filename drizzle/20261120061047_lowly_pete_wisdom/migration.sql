ALTER TABLE "tenants" ALTER COLUMN "logo_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_brand_name_key" UNIQUE("brand_name");