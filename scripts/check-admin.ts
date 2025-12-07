import { db } from '../lib/db';

async function main() {
  const user = await db.user.findUnique({
    where: { email: 'david@x907.com' },
    select: { id: true, email: true, isAdmin: true }
  });
  console.log('User:', user);

  if (user && !user.isAdmin) {
    const updated = await db.user.update({
      where: { email: 'david@x907.com' },
      data: { isAdmin: true }
    });
    console.log('Updated to admin:', updated.isAdmin);
  } else if (user?.isAdmin) {
    console.log('User is already an admin');
  } else {
    console.log('User not found');
  }
}

main().catch(console.error).finally(() => db.$disconnect());
