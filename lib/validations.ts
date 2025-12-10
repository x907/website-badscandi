import { z } from "zod";

// Maximum number of images per product
export const MAX_PRODUCT_IMAGES = 10;

// S3 bucket name for validation (set from env at runtime)
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Validate that an image URL is from our S3 bucket
 * This prevents external URL injection attacks
 *
 * Uses strict hostname matching to prevent substring bypass attacks:
 * - Validates hostname ends with ".amazonaws.com" (exact suffix match)
 * - Validates hostname matches S3 pattern: bucket.s3.region.amazonaws.com
 * - Validates bucket name matches our bucket exactly
 */
export function validateImageUrlOrigin(url: string): boolean {
  if (!url) return true; // Allow empty/optional

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Must end with exactly ".amazonaws.com" (prevents amazonaws.com.attacker.com)
    if (!hostname.endsWith(".amazonaws.com")) {
      return false;
    }

    // Parse S3 hostname format: bucket.s3.region.amazonaws.com
    // or legacy format: s3.region.amazonaws.com/bucket
    const hostParts = hostname.split(".");
    // Minimum: bucket.s3.region.amazonaws.com = 5 parts
    if (hostParts.length < 5) {
      return false;
    }

    // Verify "s3" is in the second position (bucket.s3.region.amazonaws.com)
    if (hostParts[1] !== "s3") {
      return false;
    }

    // Extract and validate bucket name (first part of hostname)
    const bucketFromHost = hostParts[0];
    if (S3_BUCKET_NAME && bucketFromHost !== S3_BUCKET_NAME.toLowerCase()) {
      return false;
    }

    // Validate the path starts with /products/
    if (!parsed.pathname.startsWith("/products/")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Custom Zod refinement for S3 image URL validation
 */
const s3ImageUrl = z
  .string()
  .url("Invalid image URL")
  .refine(validateImageUrlOrigin, {
    message: "Image URL must be from the authorized S3 bucket",
  });

// Sanitize string to prevent XSS - strips HTML tags and dangerous characters
// Uses loop-until-stable approach to prevent bypass via nested payloads
export function sanitizeString(str: string): string {
  let result = str;
  let previous: string;

  // Loop until no more changes occur (prevents nested bypass attacks)
  do {
    previous = result;
    result = result
      // Remove HTML tags and angle brackets to prevent tag injection
      .replace(/[<>]/g, "")
      // Remove dangerous URL schemes (javascript:, data:, vbscript:)
      .replace(/javascript\s*:/gi, "")
      .replace(/data\s*:/gi, "")
      .replace(/vbscript\s*:/gi, "")
      // Remove event handlers (onclick=, onerror=, etc.)
      .replace(/on\w+\s*=/gi, "");
  } while (result !== previous);

  return result.trim();
}

// Product validation schema
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name too long")
    .transform(sanitizeString),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description too long")
    .transform(sanitizeString),
  priceCents: z
    .number()
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative")
    .max(100000000, "Price too high"), // Max $1M
  imageUrl: s3ImageUrl.optional(),
  imageUrls: z
    .array(s3ImageUrl)
    .max(MAX_PRODUCT_IMAGES, `Maximum ${MAX_PRODUCT_IMAGES} images allowed`)
    .optional(),
  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(99999, "Stock too high"),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
  metaTitle: z
    .string()
    .max(70, "Meta title too long (max 70 chars)")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(160, "Meta description too long (max 160 chars)")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  altText: z
    .string()
    .max(200, "Alt text too long")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  category: z
    .string()
    .max(100, "Category too long")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  tags: z
    .string()
    .max(500, "Tags too long")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  materials: z
    .string()
    .max(200, "Materials too long")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  colors: z
    .string()
    .max(200, "Colors too long")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  dimensions: z
    .string()
    .max(200, "Dimensions too long")
    .transform(sanitizeString)
    .optional()
    .nullable(),
  room: z
    .string()
    .max(100, "Room too long")
    .transform(sanitizeString)
    .optional()
    .nullable(),
});

// Partial schema for updates (all fields optional)
export const productUpdateSchema = productSchema.partial();

// Review featured toggle schema
export const reviewFeaturedSchema = z.object({
  featured: z.boolean(),
});

// Type exports
export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
