import { db } from '../lib/db';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/promote-admin.ts <email>');
  process.exit(1);
}

async function main() {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, isAdmin: true, name: true }
  });

  if (!user) {
    console.log(`User not found: ${email}`);
    return;
  }

  console.log('User found:', user);

  if (user.isAdmin) {
    console.log('User is already an admin');
    return;
  }

  const updated = await db.user.update({
    where: { email },
    data: { isAdmin: true }
  });

  console.log(`✓ Promoted ${updated.email} to admin`);
}

main().catch(console.error).finally(() => db.$disconnect());
