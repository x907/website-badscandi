import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();
    const { id } = await params;

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

    // Check product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If slug changed, check it's unique
    if (slug && slug !== existingProduct.slug) {
      const slugExists = await db.product.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A product with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Handle imageUrls - keep imageUrl synced with first image
    let finalImageUrls = existingProduct.imageUrls;
    let primaryImageUrl = existingProduct.imageUrl;

    if (imageUrls !== undefined) {
      finalImageUrls = imageUrls;
      primaryImageUrl = imageUrls[0] || existingProduct.imageUrl;
    } else if (imageUrl !== undefined) {
      // If only imageUrl is provided, update it and add to array if not present
      primaryImageUrl = imageUrl;
      if (!finalImageUrls.includes(imageUrl)) {
        finalImageUrls = [imageUrl, ...finalImageUrls.filter(url => url !== existingProduct.imageUrl)];
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: name ?? existingProduct.name,
        slug: slug ?? existingProduct.slug,
        description: description ?? existingProduct.description,
        priceCents: priceCents !== undefined ? parseInt(priceCents) : existingProduct.priceCents,
        imageUrl: primaryImageUrl,
        imageUrls: finalImageUrls,
        stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
        featured: featured ?? existingProduct.featured,
        metaTitle: metaTitle !== undefined ? metaTitle : existingProduct.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existingProduct.metaDescription,
        altText: altText !== undefined ? altText : existingProduct.altText,
        category: category !== undefined ? category : existingProduct.category,
        tags: tags !== undefined ? tags : existingProduct.tags,
        materials: materials !== undefined ? materials : existingProduct.materials,
        colors: colors !== undefined ? colors : existingProduct.colors,
        dimensions: dimensions !== undefined ? dimensions : existingProduct.dimensions,
        room: room !== undefined ? room : existingProduct.room,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
