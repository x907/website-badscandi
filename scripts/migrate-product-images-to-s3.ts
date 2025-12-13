/**
 * Migrate product images from Etsy CDN to S3
 *
 * This script:
 * 1. Finds all products with Etsy image URLs
 * 2. Downloads each image
 * 3. Uploads to S3 with the product slug as the filename
 * 4. Updates the database with the new S3 URL
 *
 * Run with: npx tsx scripts/migrate-product-images-to-s3.ts
 *
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 */

import 'dotenv/config';
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// Get connection string and ensure sslmode=no-verify for Supabase
let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
if (connectionString.includes("sslmode=require")) {
  connectionString = connectionString.replace("sslmode=require", "sslmode=no-verify");
} else if (!connectionString.includes("sslmode=")) {
  connectionString += connectionString.includes("?") ? "&sslmode=no-verify" : "?sslmode=no-verify";
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// Check if running in dry-run mode
const DRY_RUN = process.argv.includes("--dry-run");

function getContentType(url: string): string {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes(".png")) return "image/png";
  if (lowercaseUrl.includes(".webp")) return "image/webp";
  if (lowercaseUrl.includes(".gif")) return "image/gif";
  return "image/jpeg"; // Default to JPEG for Etsy images
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      // Add a user agent to avoid potential blocking
      "User-Agent": "Mozilla/5.0 (compatible; BadScandi/1.0; +https://badscandi.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function checkS3ObjectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable", // Cache for 1 year
  });

  await s3Client.send(command);

  return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

async function migrateImages() {
  console.log("=".repeat(60));
  console.log("Product Image Migration: Etsy CDN → S3");
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("\n🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Validate environment
  if (!BUCKET_NAME) {
    console.error("❌ Error: AWS_S3_BUCKET_NAME environment variable is not set");
    process.exit(1);
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Error: AWS credentials are not configured");
    process.exit(1);
  }

  console.log(`📦 S3 Bucket: ${BUCKET_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}\n`);

  // Find all products with Etsy image URLs
  const products = await prisma.product.findMany({
    where: {
      imageUrl: {
        contains: "etsystatic.com",
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (products.length === 0) {
    console.log("✅ No products with Etsy images found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${products.length} product(s) with Etsy images to migrate\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    const key = `products/${product.slug}.jpg`;

    console.log(`\n📷 Processing: ${product.name}`);
    console.log(`   Current URL: ${product.imageUrl.substring(0, 60)}...`);
    console.log(`   Target Key: ${key}`);

    if (DRY_RUN) {
      console.log("   ✓ Would migrate this image");
      migrated++;
      continue;
    }

    try {
      // Check if already exists in S3
      const exists = await checkS3ObjectExists(key);
      if (exists) {
        console.log("   ⚠️  Image already exists in S3, updating database reference...");
        const newUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: newUrl },
        });
        console.log(`   ✓ Updated database with S3 URL`);
        skipped++;
        continue;
      }

      // Download from Etsy
      console.log("   ⬇️  Downloading from Etsy...");
      const imageBuffer = await downloadImage(product.imageUrl);
      console.log(`   ✓ Downloaded ${(imageBuffer.length / 1024).toFixed(1)} KB`);

      // Upload to S3
      console.log("   ⬆️  Uploading to S3...");
      const contentType = getContentType(product.imageUrl);
      const newUrl = await uploadToS3(imageBuffer, key, contentType);
      console.log(`   ✓ Uploaded to S3`);

      // Update database
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: newUrl },
      });
      console.log(`   ✓ Updated database`);
      console.log(`   🎉 Migration complete: ${newUrl}`);

      migrated++;
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
      failed++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log(`\n🔍 DRY RUN - Would migrate ${migrated} image(s)`);
    console.log("\nRun without --dry-run to perform the migration.");
  } else {
    console.log(`\n✅ Migrated: ${migrated}`);
    console.log(`⚠️  Skipped (already in S3): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\nSome images failed to migrate. You may want to retry or handle them manually.");
    }

    if (migrated > 0 || skipped > 0) {
      console.log("\n📝 Next steps:");
      console.log("   1. Verify images are accessible at the new S3 URLs");
      console.log("   2. Update next.config.ts to remove etsystatic.com from remotePatterns");
      console.log("   3. Test the website to ensure all images load correctly");
    }
  }
}

migrateImages()
  .catch((error) => {
    console.error("\n❌ Fatal error during migration:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
