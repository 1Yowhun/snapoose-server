CREATE TYPE "role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "role";