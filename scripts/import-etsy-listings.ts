import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

type EtsyListing = {
  url: string;
  listing_id: string;
  title: string;
  price: string;
  currency: string;
  description: string;
  images: string[];
  properties: any[];
  local_images: any[];
};

function filterLargeImages(images: string[]): string[] {
  return images.filter((url) => {
    // Keep only large images (il_794xN pattern)
    if (!url.includes("il_794xN")) return false;

    // Skip tracking pixels and junk images
    if (
      url.includes("facebook.com") ||
      url.includes("bing.com") ||
      url.includes("ispot.tv") ||
      url.includes("/iap/") ||
      url.includes("/iusa/") ||
      url.includes("/isla/")
    ) {
      return false;
    }

    return true;
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100); // Limit length
}

function extractDimensions(description: string): string | null {
  // Look for patterns like: 48x46", 24 x 36 inches, etc.
  const patterns = [
    /(\d+)\s*x\s*(\d+)\s*(?:inches?|in|")/i,
    /(\d+)\s*x\s*(\d+)\s*(?:cm)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return `${match[1]} x ${match[2]} inches`;
    }
  }

  return null;
}

function inferCategory(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();

  if (text.includes("macrame") || text.includes("macramé")) {
    return "macrame";
  }
  if (text.includes("tapestry")) {
    return "tapestry";
  }
  if (text.includes("wall hanging") || text.includes("wall-hanging")) {
    return "wall-hanging";
  }
  if (text.includes("fiber art")) {
    return "fiber-art";
  }

  return "wall-hanging"; // Default
}

function extractMaterials(description: string): string {
  const text = description.toLowerCase();

  const materials: string[] = [];

  if (text.includes("wool")) materials.push("wool");
  if (text.includes("cotton")) materials.push("cotton");
  if (text.includes("linen")) materials.push("linen");
  if (text.includes("yarn")) materials.push("yarn");
  if (text.includes("rope")) materials.push("rope");
  if (text.includes("fiber")) materials.push("fibers");

  if (materials.length > 0) {
    return materials.join(", ");
  }

  return "natural fibers"; // Default
}

function extractColors(title: string): string {
  const text = title.toLowerCase();
  const colors: string[] = [];

  const colorMap: { [key: string]: string } = {
    neutral: "neutral",
    cream: "cream",
    beige: "beige",
    white: "white",
    natural: "natural",
    ivory: "ivory",
    terracotta: "terracotta",
    rust: "rust",
    brown: "brown",
    earth: "earth",
    "off-white": "off-white",
    gray: "gray",
    grey: "gray",
    pink: "pink",
    blue: "blue",
    green: "green",
    yellow: "yellow",
    orange: "orange",
  };

  for (const [keyword, color] of Object.entries(colorMap)) {
    if (text.includes(keyword) && !colors.includes(color)) {
      colors.push(color);
    }
  }

  if (colors.length > 0) {
    return colors.join(",");
  }

  return "neutral,natural"; // Default
}

function generateTags(title: string, category: string): string {
  const tags: string[] = [];

  if (title.toLowerCase().includes("hand-dyed") || title.toLowerCase().includes("dip dye")) {
    tags.push("hand-dyed");
  }
  if (title.toLowerCase().includes("boho")) {
    tags.push("boho");
  }
  if (title.toLowerCase().includes("minimalist") || title.toLowerCase().includes("scandi")) {
    tags.push("minimalist");
  }
  if (title.toLowerCase().includes("large")) {
    tags.push("large");
  }

  tags.push(category);
  tags.push("fiber-art");

  return [...new Set(tags)].join(",");
}

function createMetaDescription(title: string, description: string): string {
  // Take first 150 chars of description or create from title
  const cleanDesc = description.replace(/\n/g, " ").trim();
  if (cleanDesc.length > 150) {
    return cleanDesc.substring(0, 147) + "...";
  }
  return cleanDesc || `${title} - Handcrafted fiber art wall hanging from Bad Scandi.`;
}

async function importListings() {
  console.log("Starting Etsy listings import...\n");

  // Read the JSON file
  const jsonPath = path.join(process.cwd(), "etsy-listings.json");

  if (!fs.existsSync(jsonPath)) {
    console.error("Error: etsy-listings.json not found!");
    console.error("Please ensure the file exists at:", jsonPath);
    process.exit(1);
  }

  const jsonContent = fs.readFileSync(jsonPath, "utf-8");

  let listings: EtsyListing[];
  try {
    listings = JSON.parse(jsonContent);
  } catch (error) {
    console.error("Error: Failed to parse JSON file!");
    console.error("Make sure etsy-listings.json contains valid JSON data.");
    process.exit(1);
  }

  if (!Array.isArray(listings)) {
    console.error("Error: JSON file should contain an array of listings!");
    process.exit(1);
  }

  console.log(`Found ${listings.length} listings to import\n`);

  let imported = 0;
  let skipped = 0;

  for (const listing of listings) {
    try {
      // Filter images to get only large ones
      const largeImages = filterLargeImages(listing.images);

      if (largeImages.length === 0) {
        console.log(`⚠️  Skipping "${listing.title}" - no large images found`);
        skipped++;
        continue;
      }

      const primaryImage = largeImages[0];
      const slug = generateSlug(listing.title);
      const priceCents = Math.round(parseFloat(listing.price) * 100);
      const dimensions = extractDimensions(listing.description);
      const category = inferCategory(listing.title, listing.description);
      const materials = extractMaterials(listing.description);
      const colors = extractColors(listing.title);
      const tags = generateTags(listing.title, category);
      const metaDescription = createMetaDescription(listing.title, listing.description);

      // Create product data
      const productData = {
        slug,
        name: listing.title,
        description: listing.description,
        priceCents,
        imageUrl: primaryImage,
        stock: 0, // Mark as sold
        featured: false,
        metaTitle: `${listing.title} | Bad Scandi`,
        metaDescription,
        altText: listing.title,
        category,
        tags,
        materials,
        colors,
        dimensions: dimensions || "Dimensions vary",
        room: "living-room,bedroom",
      };

      // Upsert the product
      await prisma.product.upsert({
        where: { slug },
        update: productData,
        create: productData,
      });

      console.log(`✓ Imported: ${listing.title}`);
      console.log(`  - Slug: ${slug}`);
      console.log(`  - Price: $${listing.price}`);
      console.log(`  - Images: ${largeImages.length} large image(s) found`);
      console.log(`  - Dimensions: ${dimensions || "Not specified"}`);
      console.log(`  - Category: ${category}`);
      console.log("");

      imported++;
    } catch (error) {
      console.error(`❌ Error importing "${listing.title}":`, error);
      skipped++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Import complete!`);
  console.log(`✓ Successfully imported: ${imported} products`);
  console.log(`⚠️  Skipped: ${skipped} products`);
  console.log("=".repeat(50));
}

importListings()
  .catch((e) => {
    console.error("Fatal error during import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
