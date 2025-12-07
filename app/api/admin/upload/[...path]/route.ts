import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { deleteProductImage } from "@/lib/s3";
import { checkRateLimit } from "@/lib/rate-limit";

// DELETE - Delete an image from S3
export async function DELETE(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    const deleted = await deleteProductImage(imageUrl);

    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Could not delete image (may not be a product image)" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
