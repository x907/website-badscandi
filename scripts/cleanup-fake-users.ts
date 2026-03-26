/**
 * Cleanup unverified/bot users from the database.
 *
 * A user is considered fake/abandoned if ALL of the following are true:
 *   - emailVerified is false (never clicked a magic link)
 *   - no linked OAuth accounts (never signed in via Google etc.)
 *   - no passkeys registered
 *   - no orders placed
 *   - not an admin
 *
 * Usage:
 *   npm run db:cleanup-fake-users          # dry run (preview only)
 *   npm run db:cleanup-fake-users -- --delete  # actually delete
 */

import { db } from '../lib/db';

const isDryRun = !process.argv.includes('--delete');

async function main() {
  if (isDryRun) {
    console.log('DRY RUN — no changes will be made. Pass --delete to actually delete.\n');
  } else {
    console.log('DELETE MODE — users will be permanently removed.\n');
  }

  const fakeUsers = await db.user.findMany({
    where: {
      emailVerified: false,
      isAdmin: false,
      orders: { none: {} },
      passkeys: { none: {} },
      accounts: { none: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (fakeUsers.length === 0) {
    console.log('No unverified users found. Nothing to clean up.');
    return;
  }

  console.log(`Found ${fakeUsers.length} unverified user(s):\n`);
  for (const user of fakeUsers) {
    const age = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  ${user.email.padEnd(50)} created ${age}d ago  (id: ${user.id})`);
  }

  if (isDryRun) {
    console.log(`\nRun with --delete to remove these ${fakeUsers.length} user(s).`);
    return;
  }

  const ids = fakeUsers.map(u => u.id);

  // Cascade deletes handle: sessions, cart, emailLogs, emailSubscriptions, events
  const result = await db.user.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`\nDeleted ${result.count} user(s).`);
}

main().catch(console.error).finally(() => db.$disconnect());
