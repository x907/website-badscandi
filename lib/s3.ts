import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

function generateId(): string {
  return randomBytes(12).toString("hex");
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[contentType] || ".jpg";
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Upload a file to S3 and return the public URL
 */
export async function uploadToS3(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const key = `reviews/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    // Note: ACL not used - bucket policy handles public read access
  });

  await s3Client.send(command);

  // Return the public URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
}

/**
 * Generate a presigned URL for direct upload from the client
 * (Alternative method - more secure for large files)
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const key = `reviews/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

  return {
    url,
    key,
  };
}

/**
 * Get the public URL for an S3 object
 */
export function getS3Url(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
}

/**
 * Upload a product image to S3
 */
export async function uploadProductImage(
  file: Buffer,
  _filename: string,
  contentType: string
): Promise<string> {
  // Validate S3 configuration
  if (!BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured");
  }
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error("AWS_ACCESS_KEY_ID is not configured");
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS_SECRET_ACCESS_KEY is not configured");
  }

  const key = `products/${generateId()}${getExtension(contentType)}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
}

/**
 * Delete a product image from S3
 */
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract the key from the URL
    // URL format: https://bucket.s3.region.amazonaws.com/products/timestamp-filename.jpg
    const url = new URL(imageUrl);
    const key = url.pathname.slice(1); // Remove leading slash

    // Only delete if it's from our bucket and is a product image
    if (!key.startsWith("products/")) {
      console.log("Skipping deletion - not a product image:", key);
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log("Deleted from S3:", key);
    return true;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    return false;
  }
}
