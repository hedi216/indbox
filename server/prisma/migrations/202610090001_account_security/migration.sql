BEGIN;
-- Additive migration: grandfather existing accounts without changing hashes or sessions.
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "temporaryPasswordExpiresAt" TIMESTAMPTZ(3),
 ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT true,
 ADD COLUMN "notificationPreferences" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "User" ALTER COLUMN "emailVerified" SET DEFAULT false;
CREATE TABLE "UserSecurityToken" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "tokenHash" TEXT NOT NULL,
 "purpose" TEXT NOT NULL,
 "expiresAt" TIMESTAMPTZ(3) NOT NULL,
 "usedAt" TIMESTAMPTZ(3),
 "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "UserSecurityToken_tokenHash_key" ON "UserSecurityToken"("tokenHash");
CREATE INDEX "UserSecurityToken_userId_purpose_idx" ON "UserSecurityToken"("userId", "purpose");
ALTER TABLE "EmailNotification" ADD COLUMN "expiresAt" TIMESTAMPTZ(3),
 ADD COLUMN "sensitive" BOOLEAN NOT NULL DEFAULT false;
-- Preserve all existing states; cancelled security messages must never be delivered.
ALTER TABLE "EmailNotification" DROP CONSTRAINT "Email_status_valid";
ALTER TABLE "EmailNotification" ADD CONSTRAINT "Email_status_valid"
 CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'RETRY', 'FAILED', 'CANCELLED'));
COMMIT;
