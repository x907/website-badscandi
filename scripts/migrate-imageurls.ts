import { db } from '../lib/db';

async function main() {
  console.log('Migrating imageUrl to imageUrls array...');

  // Get all products that have imageUrl but empty imageUrls
  const products = await db.product.findMany({
    where: {
      imageUrls: {
        isEmpty: true
      }
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    }
  });

  console.log(`Found ${products.length} products to migrate`);

  for (const product of products) {
    if (product.imageUrl) {
      await db.product.update({
        where: { id: product.id },
        data: {
          imageUrls: [product.imageUrl]
        }
      });
      console.log(`✓ Migrated: ${product.name}`);
    }
  }

  console.log('Migration complete!');
}

main().catch(console.error).finally(() => db.$disconnect());
