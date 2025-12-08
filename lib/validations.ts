import { z } from "zod";

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
  imageUrl: z.string().url("Invalid image URL").optional(),
  imageUrls: z.array(z.string().url("Invalid image URL")).optional(),
  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(99999, "Stock too high"),
  featured: z.boolean().optional(),
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
