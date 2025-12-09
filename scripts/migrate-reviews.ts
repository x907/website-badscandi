// Script to migrate JSON reviews to database
// Run with: npx tsx scripts/migrate-reviews.ts

import { db } from "@/lib/db";
import reviewsData from "@/data/reviews.json";

async function migrateReviews() {
  console.log("Migrating reviews from JSON to database...\n");

  for (let i = 0; i < reviewsData.length; i++) {
    const review = reviewsData[i];

    // Check if review already exists (by matching author and text)
    const existing = await db.review.findFirst({
      where: {
        customerName: review.author,
        comment: review.text,
      },
    });

    if (existing) {
      console.log(`⏭ Review from ${review.author} already exists, skipping`);
      continue;
    }

    // Create the review - first 3 will be featured
    const isFeatured = i < 3;

    await db.review.create({
      data: {
        customerName: review.author,
        rating: 5,
        comment: review.text,
        imageUrls: review.photos || [],
        approved: true,
        featured: isFeatured,
        verified: review.verified ?? true,
      },
    });

    console.log(`✓ Migrated review from ${review.author}${isFeatured ? " (featured)" : ""}`);
  }

  console.log("\nMigration complete!");
}

migrateReviews()
  .catch(console.error)
  .finally(() => db.$disconnect());
