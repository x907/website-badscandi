import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const products = [
    {
      slug: "oak-dining-table",
      name: "Oak Dining Table",
      description:
        "A beautiful solid oak dining table with clean lines and timeless design. Seats 6-8 people comfortably. Handcrafted from sustainably sourced Scandinavian oak.",
      priceCents: 129900,
      imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
      stock: 5,
      featured: true,
    },
    {
      slug: "minimalist-chair",
      name: "Minimalist Chair",
      description:
        "Elegant dining chair with curved backrest for optimal comfort. Made from solid birch wood with a natural oil finish.",
      priceCents: 24900,
      imageUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
      stock: 20,
      featured: true,
    },
    {
      slug: "wool-throw-blanket",
      name: "Wool Throw Blanket",
      description:
        "Luxuriously soft merino wool throw blanket in natural grey. Perfect for cozy evenings. Woven in Norway using traditional techniques.",
      priceCents: 8900,
      imageUrl: "https://images.unsplash.com/photo-1585128719398-e4452d1b6d6f?w=800&q=80",
      stock: 30,
      featured: true,
    },
    {
      slug: "ceramic-vase",
      name: "Ceramic Vase",
      description:
        "Handmade ceramic vase with matte white glaze. Simple, elegant form that complements any interior. Each piece is unique.",
      priceCents: 4900,
      imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80",
      stock: 15,
      featured: false,
    },
    {
      slug: "oak-bookshelf",
      name: "Oak Bookshelf",
      description:
        "Five-tier open bookshelf in solid oak. Clean, modular design that works in any space. Easy to assemble.",
      priceCents: 64900,
      imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800&q=80",
      stock: 8,
      featured: false,
    },
    {
      slug: "linen-cushion",
      name: "Linen Cushion",
      description:
        "Premium linen cushion cover in natural beige. Soft texture with invisible zipper. Insert included.",
      priceCents: 3900,
      imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80",
      stock: 50,
      featured: false,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
    console.log(`Created/Updated product: ${product.name}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
