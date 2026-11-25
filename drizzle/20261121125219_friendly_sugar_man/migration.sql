DROP INDEX "session_expires_idx";--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "session" ("expires_at") WHERE "status" = 'FINISHED' AND "expires_at" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_status_valid", ADD CONSTRAINT "session_status_valid" CHECK ("status" IN ('STARTED','FINISHED'));