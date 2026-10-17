CREATE SEQUENCE "public"."frame_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "frames" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"code" varchar(100) DEFAULT 'FRM-' || nextval('frame_code_seq') NOT NULL,
	"name" varchar(255) NOT NULL,
	"canvas_width" integer NOT NULL,
	"canvas_height" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"overlay_url" text,
	"slots" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(0) with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "frames" ADD CONSTRAINT "frames_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "frames" ADD CONSTRAINT "frames_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "frames" ADD CONSTRAINT "frames_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;