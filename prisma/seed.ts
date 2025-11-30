import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const products = [
    {
      slug: "neutral-boho-wall-hanging-tapestry",
      name: "Neutral Boho Wall Hanging Tapestry - Hand Dyed",
      description:
        "Stunning hand-dyed fiber art wall hanging featuring soft neutral tones of cream, beige, and natural ivory. This boho tapestry brings warmth and texture to any living room or bedroom. Each piece is unique, created using traditional dip dye techniques with premium cotton yarn. Perfect for adding Scandinavian minimalist charm to your modern home decor.",
      priceCents: 14900,
      imageUrl: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=800&q=80",
      stock: 8,
      featured: true,
      metaTitle: "Hand-Dyed Neutral Boho Wall Hanging Tapestry | Bad Scandi",
      metaDescription: "Unique hand-dyed fiber art wall hanging in neutral tones. Perfect boho tapestry for living room or bedroom. Scandinavian minimalist style.",
      altText: "Neutral cream and beige hand-dyed boho wall hanging tapestry with fringe",
      category: "wall-hanging",
      tags: "boho,hand-dyed,neutral,fiber-art,dip-dye",
      materials: "100% cotton yarn",
      colors: "cream,beige,natural,ivory",
      dimensions: "24 x 36 inches",
      room: "living-room,bedroom",
    },
    {
      slug: "large-macrame-wall-hanging-living-room",
      name: "Large Macrame Wall Hanging for Living Room",
      description:
        "Handcrafted macrame wall hanging perfect for making a statement in your living room. This woven wall hanging features intricate knotting techniques and natural cotton rope in soft neutral tones. The bohemian home decor piece adds texture and warmth to any space. Ideal for modern, Scandi, or boho-style interiors.",
      priceCents: 18900,
      imageUrl: "https://images.unsplash.com/photo-1600684659818-0099a1b51420?w=800&q=80",
      stock: 12,
      featured: true,
      metaTitle: "Large Macrame Wall Hanging for Living Room Decor | Boho Style",
      metaDescription: "Handcrafted large macrame wall hanging. Perfect bohemian wall decor for living rooms. Natural cotton, neutral colors, Scandi minimalist design.",
      altText: "Large macrame wall hanging with intricate knots and fringe for living room",
      category: "macrame",
      tags: "macrame,boho,large,wall-hanging,neutral",
      materials: "natural cotton rope",
      colors: "natural,cream,off-white",
      dimensions: "30 x 48 inches",
      room: "living-room",
    },
    {
      slug: "hand-dyed-yarn-tapestry-boho-decor",
      name: "Hand-Dyed Yarn Tapestry - Boho Home Decor",
      description:
        "Beautiful hand-dyed yarn wall hanging featuring gradient colors from warm terracotta to soft cream. This fiber art tapestry is perfect for adding bohemian flair to your bedroom or living room. Each piece is one-of-a-kind, created using artisanal dip dye methods. The woven texture and flowing fringe create stunning visual interest on any wall.",
      priceCents: 12900,
      imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80",
      stock: 15,
      featured: true,
      metaTitle: "Hand-Dyed Yarn Tapestry - Unique Boho Wall Decor | Bad Scandi",
      metaDescription: "Handmade dip-dye yarn tapestry in warm gradient colors. Perfect bohemian home decor. Unique fiber art wall hanging for bedroom or living room.",
      altText: "Hand-dyed yarn tapestry wall hanging with terracotta and cream gradient",
      category: "tapestry",
      tags: "hand-dyed,yarn,tapestry,boho,gradient,dip-dye",
      materials: "hand-dyed wool blend yarn",
      colors: "terracotta,cream,rust,beige",
      dimensions: "20 x 30 inches",
      room: "bedroom,living-room",
    },
    {
      slug: "scandinavian-minimalist-fiber-art-wall-hanging",
      name: "Scandinavian Minimalist Fiber Art Wall Hanging",
      description:
        "Clean-lined fiber art wall hanging embodying Scandinavian minimalist design. This modern wall decor piece features simple geometric patterns in neutral tones. Hand-woven with premium materials, perfect for contemporary spaces that appreciate understated elegance. Ideal gift for housewarming or home decor enthusiasts.",
      priceCents: 16900,
      imageUrl: "https://images.unsplash.com/photo-1618196139827-c5c748a117cd?w=800&q=80",
      stock: 10,
      featured: false,
      metaTitle: "Scandinavian Minimalist Fiber Art Wall Hanging | Modern Decor",
      metaDescription: "Minimalist fiber art wall hanging with Scandi design. Perfect modern wall decor. Neutral colors, geometric pattern, handwoven textile art.",
      altText: "Scandinavian style minimalist fiber art wall hanging with geometric pattern",
      category: "wall-hanging",
      tags: "scandinavian,minimalist,fiber-art,modern,geometric",
      materials: "cotton and linen blend",
      colors: "white,gray,natural",
      dimensions: "18 x 24 inches",
      room: "any",
    },
    {
      slug: "woven-wall-hanging-bedroom-decor",
      name: "Woven Wall Hanging - Bedroom Wall Decor",
      description:
        "Soft and dreamy woven wall hanging perfect for bedroom decor. Features layered textures and flowing fringe in calming neutral tones. This textile wall art creates a cozy, bohemian atmosphere. Handcrafted with care using premium yarns and traditional weaving techniques.",
      priceCents: 11900,
      imageUrl: "https://images.unsplash.com/photo-1600184895190-e2c60e9e31e8?w=800&q=80",
      stock: 18,
      featured: false,
      metaTitle: "Woven Wall Hanging for Bedroom - Boho Textile Wall Art",
      metaDescription: "Handwoven wall hanging perfect for bedrooms. Soft textures, neutral colors, bohemian style. Beautiful textile wall art for cozy spaces.",
      altText: "Soft woven wall hanging with layers and fringe for bedroom decor",
      category: "wall-hanging",
      tags: "woven,bedroom,textile-art,neutral,soft",
      materials: "merino wool and cotton",
      colors: "cream,beige,white,natural",
      dimensions: "22 x 32 inches",
      room: "bedroom",
    },
    {
      slug: "boho-tapestry-gift-housewarming",
      name: "Boho Tapestry Wall Decor - Perfect Housewarming Gift",
      description:
        "Charming boho tapestry that makes the perfect housewarming or home decor gift. Hand-dyed with beautiful earthy tones and finished with playful fringe. This fiber art piece brings warmth and personality to any room. Lightweight and easy to hang, ready to gift or display.",
      priceCents: 9900,
      imageUrl: "https://images.unsplash.com/photo-1616484415209-18cbd64b0ddd?w=800&q=80",
      stock: 25,
      featured: false,
      metaTitle: "Boho Tapestry Wall Decor - Perfect Home Decor Gift | Bad Scandi",
      metaDescription: "Beautiful boho tapestry, perfect for housewarming gifts. Hand-dyed fiber art with earthy tones. Unique home decor wall hanging.",
      altText: "Boho tapestry wall decor with hand-dyed earthy colors and fringe",
      category: "tapestry",
      tags: "boho,tapestry,gift,hand-dyed,earthy",
      materials: "cotton yarn",
      colors: "earth,rust,cream,brown",
      dimensions: "16 x 24 inches",
      room: "any",
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
