ALTER TABLE "vouchers" RENAME COLUMN "discount_precent" TO "discount_percent";--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "discount_percent" SET DATA TYPE numeric(5,2) USING "discount_percent"::numeric(5,2);--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "discount_percent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "used_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_discount_range", ADD CONSTRAINT "vouchers_discount_range" CHECK ("discount_percent" BETWEEN 1 AND 100);