CREATE TABLE "voucher_booths" (
	"voucher_id" uuid,
	"booth_id" uuid,
	CONSTRAINT "voucher_booths_pkey" PRIMARY KEY("voucher_id","booth_id")
);
--> statement-breakpoint
CREATE TABLE "frame_booths" (
	"frame_id" uuid,
	"booth_id" uuid,
	CONSTRAINT "frame_booths_pkey" PRIMARY KEY("frame_id","booth_id")
);
--> statement-breakpoint
ALTER TABLE "voucher_booths" ADD CONSTRAINT "voucher_booths_voucher_id_vouchers_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "voucher_booths" ADD CONSTRAINT "voucher_booths_booth_id_booths_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "booths"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "frame_booths" ADD CONSTRAINT "frame_booths_frame_id_frames_id_fkey" FOREIGN KEY ("frame_id") REFERENCES "frames"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "frame_booths" ADD CONSTRAINT "frame_booths_booth_id_booths_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "booths"("id") ON DELETE CASCADE;