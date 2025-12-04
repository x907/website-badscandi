const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPasskeys() {
  try {
    const passkeys = await prisma.passkey.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    console.log('Total passkeys:', passkeys.length);
    console.log('\nPasskey data:');
    passkeys.forEach(pk => {
      console.log({
        id: pk.id.substring(0, 8) + '...',
        name: pk.name,
        createdAt: pk.createdAt,
        createdAtType: typeof pk.createdAt,
        isValidDate: pk.createdAt instanceof Date && !isNaN(pk.createdAt.getTime()),
      });
    });

    const nullDates = passkeys.filter(pk => !pk.createdAt || isNaN(new Date(pk.createdAt).getTime()));
    console.log(`\nPasskeys with null/invalid createdAt: ${nullDates.length}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasskeys();
