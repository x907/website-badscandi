# Better Auth Migration Guide

## Database Schema Mapping

Better Auth can work with existing NextAuth/Auth.js database tables without requiring table renames. The Prisma adapter handles the field mapping automatically.

### Table Compatibility

| NextAuth Table | Better Auth Expected | Status |
|---------------|---------------------|---------|
| User | user | ✅ Compatible (lowercase) |
| Account | account | ✅ Compatible (lowercase) |
| Session | session | ✅ Compatible (lowercase) |
| VerificationToken | verification | ⚠️ Needs mapping |
| Passkey | passkey | ✅ Compatible (custom table) |

### Field Mappings

Better Auth's Prisma adapter automatically maps these fields:

**User table:**
- `id` → `id`
- `email` → `email`
- `emailVerified` → `emailVerified`
- `name` → `name`
- `image` → `image`
- `createdAt` → `createdAt`
- `updatedAt` → `updatedAt`

**Account table:**
- `userId` → `userId`
- `type` → `type`
- `provider` → `provider`
- `providerAccountId` → `providerAccountId`
- `refresh_token` → `refresh_token`
- `access_token` → `access_token`
- `expires_at` → `expires_at`
- `token_type` → `token_type`
- `scope` → `scope`
- `id_token` → `id_token`
- `session_state` → `session_state`

**Session table:**
- `id` → `id`
- `sessionToken` → `token` (Better Auth calls it `token`)
- `userId` → `userId`
- `expires` → `expiresAt` (Better Auth calls it `expiresAt`)

**Passkey table:** (Custom implementation - Better Auth plugin adds these)
- `id` → `id`
- `userId` → `userId`
- `name` → `name`
- `credentialId` → `credentialID` or `publicKey` depending on plugin version
- `publicKey` → `publicKey`
- `counter` → `counter`
- `transports` → `transports`
- `createdAt` → `createdAt`
- `lastUsed` → `lastUsed`

## Required Schema Changes

### 1. Session Table Field Rename

Better Auth expects `token` instead of `sessionToken` and `expiresAt` instead of `expires`.

**Option A: Update Prisma schema** (Recommended for fresh deploys):
```prisma
model Session {
  id        String   @id @default(cuid())
  token     String   @unique  // Was: sessionToken
  userId    String
  expiresAt DateTime            // Was: expires
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Option B: Use database migration** (For existing data):
```sql
-- Rename sessionToken to token
ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO "token";

-- Rename expires to expiresAt
ALTER TABLE "Session" RENAME COLUMN "expires" TO "expiresAt";
```

### 2. Verification Token (Optional)

If using email verification, Better Auth expects a `verification` table instead of `VerificationToken`. Since we're only using social + passkeys, this table can be removed:

```prisma
// Remove this model if not using email/password auth
// model VerificationToken {
//   identifier String
//   token      String   @unique
//   expires    DateTime
//
//   @@unique([identifier, token])
// }
```

## Migration Steps

1. **Backup your database** before making changes
2. **Update Prisma schema** (see changes above)
3. **Create migration**:
   ```bash
   npx prisma migrate dev --name better-auth-migration
   ```
4. **Apply to production**:
   ```bash
   npx prisma migrate deploy
   ```

## Environment Variables

### Removed (NextAuth specific):
- `NEXTAUTH_URL` → Not needed (Better Auth uses `NEXT_PUBLIC_SITE_URL`)
- `NEXTAUTH_SECRET` → Not needed (Better Auth generates internally)

### Kept (Compatible):
- `DATABASE_URL` → Same
- `RP_NAME`, `RP_ID`, `RP_ORIGIN` → Same (for passkey plugin)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` → Same
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` → Same
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` → Same
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` → Same
- `NEXT_PUBLIC_SITE_URL` → Same

## Code Changes Summary

### Files Modified:
- `lib/auth.ts` → Complete rewrite with Better Auth
- `lib/auth-client.ts` → New file for client-side auth
- `app/api/auth/[...all]/route.ts` → New Better Auth handler
- `app/auth/signin/page.tsx` → Updated to use Better Auth client
- `app/account/page.tsx` → Updated session retrieval
- `components/layout/header.tsx` → Updated session retrieval
- `components/passkey-enroll.tsx` → Updated to use Better Auth passkey plugin
- `app/api/checkout/route.ts` → Updated session retrieval
- `package.json` → Removed NextAuth, added Better Auth

### Files Deleted:
- `app/api/auth/[...nextauth]/route.ts` → Replaced by `[...all]`
- `app/api/passkey/*` → Replaced by Better Auth passkey plugin endpoints
- `lib/webauthn.ts` → Replaced by Better Auth passkey plugin
- `types/next-auth.d.ts` → No longer needed

### New Features:
- **Passkey signin** now enabled on signin page
- **Better error handling** in auth flows
- **Simpler API** - no custom passkey endpoints needed
- **Built-in CSRF protection** from Better Auth
- **Better TypeScript types** from Better Auth

## Testing Checklist

After migration:
- [ ] Can sign in with Google
- [ ] Can sign in with Apple (if configured)
- [ ] Can sign in with Facebook (if configured)
- [ ] Can sign in with Microsoft (if configured)
- [ ] Can register a passkey after social signin
- [ ] Can sign in with existing passkey
- [ ] Session persists across page loads
- [ ] Sign out works correctly
- [ ] Protected routes redirect to signin
- [ ] Checkout requires authentication
- [ ] Orders are saved with correct user ID

## Rollback Plan

If issues occur:
1. **Revert database migration**:
   ```sql
   ALTER TABLE "Session" RENAME COLUMN "token" TO "sessionToken";
   ALTER TABLE "Session" RENAME COLUMN "expiresAt" TO "expires";
   ```
2. **Restore from git**:
   ```bash
   git checkout HEAD~1 -- lib/auth.ts app/ components/ package.json
   npm install
   ```
3. **Restart application**

## Support

- Better Auth Docs: https://www.better-auth.com/docs
- Migration Guide: https://www.better-auth.com/docs/guides/next-auth-migration-guide
- Passkey Plugin: https://www.better-auth.com/docs/plugins/passkey
