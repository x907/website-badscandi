import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// GET - List all products
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
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
    const {
      name,
      slug,
      description,
      priceCents,
      imageUrl,
      imageUrls,
      stock,
      featured,
      metaTitle,
      metaDescription,
      altText,
      category,
      tags,
      materials,
      colors,
      dimensions,
      room,
    } = body;

    // Handle imageUrls - use imageUrls array if provided, otherwise use single imageUrl
    const finalImageUrls: string[] = imageUrls?.length > 0
      ? imageUrls
      : (imageUrl ? [imageUrl] : []);
    const primaryImageUrl = finalImageUrls[0] || "";

    // Validate required fields
    if (!name || !slug || !description || !priceCents || !primaryImageUrl) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, description, priceCents, imageUrl" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingProduct = await db.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        priceCents: parseInt(priceCents),
        imageUrl: primaryImageUrl,
        imageUrls: finalImageUrls,
        stock: parseInt(stock) || 0,
        featured: featured || false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        altText: altText || null,
        category: category || null,
        tags: tags || null,
        materials: materials || null,
        colors: colors || null,
        dimensions: dimensions || null,
        room: room || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
