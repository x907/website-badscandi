const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    console.log('Total orders:', orders.length);
    console.log('\nOrder data:');
    orders.forEach(order => {
      console.log({
        id: order.id.substring(0, 8) + '...',
        userId: order.userId ? order.userId.substring(0, 8) + '...' : null,
        createdAt: order.createdAt,
        createdAtType: typeof order.createdAt,
        isValidDate: order.createdAt instanceof Date && !isNaN(order.createdAt.getTime()),
      });
    });

    const nullDates = orders.filter(order => !order.createdAt || isNaN(new Date(order.createdAt).getTime()));
    console.log(`\nOrders with null/invalid createdAt: ${nullDates.length}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
