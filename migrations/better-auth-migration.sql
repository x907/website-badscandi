-- Better Auth Migration SQL
-- Run this migration to update Session table field names for Better Auth compatibility
--
-- WARNING: This will modify your database schema. Back up your database first!
--
-- Usage:
--   psql $DATABASE_URL -f migrations/better-auth-migration.sql
-- OR run via Prisma:
--   npx prisma db execute --file migrations/better-auth-migration.sql

-- BEGIN TRANSACTION for safety
BEGIN;

-- Rename sessionToken to token
ALTER TABLE "Session"
  RENAME COLUMN "sessionToken" TO "token";

-- Rename expires to expiresAt
ALTER TABLE "Session"
  RENAME COLUMN "expires" TO "expiresAt";

-- Drop VerificationToken table (not needed for social + passkey auth)
-- Comment this out if you plan to use email/password authentication
DROP TABLE IF EXISTS "VerificationToken";

-- COMMIT changes
COMMIT;

-- Verification query - should return renamed columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Session';
