/**
 * Script to migrate review images from Etsy to local public folder
 *
 * Run with: npx tsx scripts/migrate-review-images.ts
 */

import * as fs from "fs";
import * as path from "path";

interface Review {
  id: string;
  author: string;
  date: string | null;
  rating: number | null;
  text: string;
  photos: string[];
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  // Create the reviews directory in public if it doesn't exist
  const publicReviewsDir = path.join(process.cwd(), "public", "reviews");
  if (!fs.existsSync(publicReviewsDir)) {
    fs.mkdirSync(publicReviewsDir, { recursive: true });
  }

  // Read the reviews.json file
  const reviewsPath = path.join(process.cwd(), "data", "reviews.json");
  const reviews: Review[] = JSON.parse(fs.readFileSync(reviewsPath, "utf-8"));

  console.log(`Found ${reviews.length} reviews to process`);

  const updatedReviews: Review[] = [];

  for (const review of reviews) {
    const updatedPhotos: string[] = [];

    for (let i = 0; i < review.photos.length; i++) {
      const photoUrl = review.photos[i];

      // Skip if already local
      if (photoUrl.startsWith("/reviews/")) {
        console.log(`  Photo already local, skipping: ${photoUrl}`);
        updatedPhotos.push(photoUrl);
        continue;
      }

      console.log(`Processing review ${review.id} photo ${i + 1}...`);

      try {
        // Download the image
        console.log(`  Downloading: ${photoUrl}`);
        const imageBuffer = await downloadImage(photoUrl);

        // Save to public/reviews folder
        const filename = `etsy-review-${review.id}-${i + 1}.jpg`;
        const localPath = path.join(publicReviewsDir, filename);
        fs.writeFileSync(localPath, imageBuffer);

        // Use relative path for Next.js Image
        const localUrl = `/reviews/${filename}`;
        console.log(`  Saved: ${localUrl}`);
        updatedPhotos.push(localUrl);
      } catch (error) {
        console.error(`  Error processing photo: ${error}`);
        // Keep original URL if migration fails
        updatedPhotos.push(photoUrl);
      }
    }

    updatedReviews.push({
      ...review,
      photos: updatedPhotos,
    });
  }

  // Write updated reviews.json
  fs.writeFileSync(reviewsPath, JSON.stringify(updatedReviews, null, 2) + "\n");
  console.log("\nUpdated reviews.json with local paths");
}

main().catch(console.error);
