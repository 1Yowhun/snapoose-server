CREATE TABLE "product_booths" (
	"product_id" uuid,
	"booth_id" uuid,
	CONSTRAINT "product_booths_pkey" PRIMARY KEY("product_id","booth_id")
);
--> statement-breakpoint
ALTER TABLE "product_booths" ADD CONSTRAINT "product_booths_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_booths" ADD CONSTRAINT "product_booths_booth_id_booths_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "booths"("id") ON DELETE CASCADE;