import { prisma } from "../lib/prisma";

async function createTestOrders() {
  const userId = "fLYWPQgll6Oq7WilLAyAdqg6T0paEnMU";

  // Get some random products
  const products = await prisma.product.findMany({ take: 5 });

  if (products.length === 0) {
    console.log("No products found!");
    return;
  }

  const now = Date.now();

  // Create 3 completed orders from different dates
  const orders = [
    {
      userId,
      stripeId: `test_order_${now}_1`,
      totalCents: products[0].priceCents,
      status: "completed",
      items: JSON.stringify([
        {
          id: products[0].id,
          name: products[0].name,
          priceCents: products[0].priceCents,
          quantity: 1,
          imageUrl: products[0].imageUrl
        }
      ]),
      createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    },
    {
      userId,
      stripeId: `test_order_${now}_2`,
      totalCents: products[1].priceCents + products[2].priceCents,
      status: "completed",
      items: JSON.stringify([
        {
          id: products[1].id,
          name: products[1].name,
          priceCents: products[1].priceCents,
          quantity: 1,
          imageUrl: products[1].imageUrl
        },
        {
          id: products[2].id,
          name: products[2].name,
          priceCents: products[2].priceCents,
          quantity: 1,
          imageUrl: products[2].imageUrl
        }
      ]),
      createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
    {
      userId,
      stripeId: `test_order_${now}_3`,
      totalCents: products[3].priceCents,
      status: "completed",
      items: JSON.stringify([
        {
          id: products[3].id,
          name: products[3].name,
          priceCents: products[3].priceCents,
          quantity: 1,
          imageUrl: products[3].imageUrl
        }
      ]),
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    }
  ];

  // Create the orders
  for (const orderData of orders) {
    const order = await prisma.order.create({
      data: orderData
    });
    console.log(`✓ Created order ${order.id}`);
    console.log(`  Total: $${order.totalCents / 100}`);
    console.log(`  Date: ${order.createdAt.toLocaleDateString()}`);
    console.log(`  Items: ${JSON.parse(order.items as string).length}`);
    console.log("");
  }

  console.log("✅ Test orders created successfully!");
  console.log("You can now test the review functionality with these past purchases.");
}

createTestOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error creating test orders:", error);
    process.exit(1);
  });
