ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE integer USING "price"::integer;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" DROP DEFAULT;