import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteProductImage } from "@/lib/s3";
import { productUpdateSchema } from "@/lib/validations";
import { logAuditEvent, createChangesObject } from "@/lib/audit";
import { ZodError } from "zod";

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

    // Check product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Prepare data for validation
    const dataToValidate: Record<string, unknown> = {};
    if (body.name !== undefined) dataToValidate.name = body.name;
    if (body.slug !== undefined) dataToValidate.slug = body.slug;
    if (body.description !== undefined) dataToValidate.description = body.description;
    if (body.priceCents !== undefined) dataToValidate.priceCents = parseInt(body.priceCents);
    if (body.stock !== undefined) dataToValidate.stock = parseInt(body.stock);
    if (body.featured !== undefined) dataToValidate.featured = body.featured;
    if (body.hidden !== undefined) dataToValidate.hidden = body.hidden;
    if (body.metaTitle !== undefined) dataToValidate.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) dataToValidate.metaDescription = body.metaDescription;
    if (body.altText !== undefined) dataToValidate.altText = body.altText;
    if (body.category !== undefined) dataToValidate.category = body.category;
    if (body.tags !== undefined) dataToValidate.tags = body.tags;
    if (body.materials !== undefined) dataToValidate.materials = body.materials;
    if (body.colors !== undefined) dataToValidate.colors = body.colors;
    if (body.dimensions !== undefined) dataToValidate.dimensions = body.dimensions;
    if (body.room !== undefined) dataToValidate.room = body.room;

    // Validate with Zod schema (partial - all fields optional)
    const validatedData = productUpdateSchema.parse(dataToValidate);

    // If slug changed, check it's unique
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugExists = await db.product.findUnique({
        where: { slug: validatedData.slug },
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

    if (body.imageUrls !== undefined) {
      finalImageUrls = body.imageUrls;
      primaryImageUrl = body.imageUrls[0] || existingProduct.imageUrl;
    } else if (body.imageUrl !== undefined) {
      primaryImageUrl = body.imageUrl;
      if (!finalImageUrls.includes(body.imageUrl)) {
        finalImageUrls = [body.imageUrl, ...finalImageUrls.filter((url: string) => url !== existingProduct.imageUrl)];
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: validatedData.name ?? existingProduct.name,
        slug: validatedData.slug ?? existingProduct.slug,
        description: validatedData.description ?? existingProduct.description,
        priceCents: validatedData.priceCents ?? existingProduct.priceCents,
        imageUrl: primaryImageUrl,
        imageUrls: finalImageUrls,
        stock: validatedData.stock ?? existingProduct.stock,
        featured: validatedData.featured ?? existingProduct.featured,
        hidden: validatedData.hidden ?? existingProduct.hidden,
        metaTitle: validatedData.metaTitle !== undefined ? validatedData.metaTitle : existingProduct.metaTitle,
        metaDescription: validatedData.metaDescription !== undefined ? validatedData.metaDescription : existingProduct.metaDescription,
        altText: validatedData.altText !== undefined ? validatedData.altText : existingProduct.altText,
        category: validatedData.category !== undefined ? validatedData.category : existingProduct.category,
        tags: validatedData.tags !== undefined ? validatedData.tags : existingProduct.tags,
        materials: validatedData.materials !== undefined ? validatedData.materials : existingProduct.materials,
        colors: validatedData.colors !== undefined ? validatedData.colors : existingProduct.colors,
        dimensions: validatedData.dimensions !== undefined ? validatedData.dimensions : existingProduct.dimensions,
        room: validatedData.room !== undefined ? validatedData.room : existingProduct.room,
      },
    });

    // Log audit event with changes (including imageUrls for image reordering)
    const changes = createChangesObject(
      existingProduct as unknown as Record<string, unknown>,
      product as unknown as Record<string, unknown>,
      ["name", "slug", "description", "priceCents", "stock", "featured", "hidden", "category", "imageUrls"]
    );

    await logAuditEvent({
      action: "update",
      entityType: "product",
      entityId: product.id,
      changes: changes || { updated: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);

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

    // Delete all images from S3 before deleting the product
    const imagesToDelete = product.imageUrls.length > 0
      ? product.imageUrls
      : (product.imageUrl ? [product.imageUrl] : []);

    for (const imageUrl of imagesToDelete) {
      try {
        await deleteProductImage(imageUrl);
      } catch (error) {
        console.error("Error deleting image from S3:", imageUrl, error);
      }
    }

    await db.product.delete({
      where: { id },
    });

    // Log audit event
    await logAuditEvent({
      action: "delete",
      entityType: "product",
      entityId: id,
      changes: { name: product.name, slug: product.slug },
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
