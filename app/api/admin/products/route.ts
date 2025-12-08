import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { productSchema } from "@/lib/validations";
import { logAuditEvent } from "@/lib/audit";
import { ZodError } from "zod";

// GET - List all products with pagination
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    // Parse pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100 per page
    const skip = (page - 1) * limit;
    const category = searchParams.get("category"); // Optional filter
    const hidden = searchParams.get("hidden"); // Optional filter

    // Build where clause
    const where: { category?: string; hidden?: boolean } = {};
    if (category) where.category = category;
    if (hidden !== null) where.hidden = hidden === "true";

    // Get total count for pagination
    const total = await db.product.count({ where });

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const body = await request.json();

    // Handle imageUrls - use imageUrls array if provided, otherwise use single imageUrl
    const finalImageUrls: string[] = body.imageUrls?.length > 0
      ? body.imageUrls
      : (body.imageUrl ? [body.imageUrl] : []);
    const primaryImageUrl = finalImageUrls[0] || "";

    // Validate with Zod schema (includes XSS sanitization)
    const validatedData = productSchema.parse({
      ...body,
      priceCents: parseInt(body.priceCents) || 0,
      stock: parseInt(body.stock) || 0,
      imageUrl: primaryImageUrl,
      imageUrls: finalImageUrls,
    });

    // Check if slug already exists
    const existingProduct = await db.product.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const product = await db.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        priceCents: validatedData.priceCents,
        imageUrl: primaryImageUrl,
        imageUrls: finalImageUrls,
        stock: validatedData.stock,
        featured: validatedData.featured || false,
        hidden: validatedData.hidden || false,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        altText: validatedData.altText || null,
        category: validatedData.category || null,
        tags: validatedData.tags || null,
        materials: validatedData.materials || null,
        colors: validatedData.colors || null,
        dimensions: validatedData.dimensions || null,
        room: validatedData.room || null,
      },
    });

    // Log audit event
    await logAuditEvent({
      action: "create",
      entityType: "product",
      entityId: product.id,
      changes: { name: product.name, slug: product.slug },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errors = error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
