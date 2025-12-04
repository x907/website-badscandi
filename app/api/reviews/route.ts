import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to submit a review" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const customerName = formData.get("customerName") as string;
    const email = formData.get("email") as string | null;
    const rating = parseInt(formData.get("rating") as string);
    const comment = formData.get("comment") as string;
    const productName = formData.get("productName") as string | null;
    const productId = formData.get("productId") as string | null;

    // Validation
    if (!customerName?.trim()) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    if (!comment?.trim()) {
      return NextResponse.json(
        { error: "Review comment is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify the user has purchased this product
    const purchasedOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "completed",
      },
    });

    if (!purchasedOrder) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 }
      );
    }

    // Parse order items and check if this product is in any of their orders
    const items = JSON.parse(purchasedOrder.items as string) as Array<{
      id: string;
      name: string;
      priceCents: number;
      quantity: number;
      imageUrl: string;
    }>;

    const hasPurchased = items.some((item) => item.id === productId);

    if (!hasPurchased) {
      // Check other orders
      const allOrders = await prisma.order.findMany({
        where: {
          userId: session.user.id,
          status: "completed",
        },
      });

      let foundProduct = false;
      for (const order of allOrders) {
        const orderItems = JSON.parse(order.items as string) as Array<{
          id: string;
        }>;
        if (orderItems.some((item) => item.id === productId)) {
          foundProduct = true;
          break;
        }
      }

      if (!foundProduct) {
        return NextResponse.json(
          { error: "You can only review products you have purchased" },
          { status: 403 }
        );
      }
    }

    // Get photo files (if any)
    const photoFiles = formData.getAll("photos") as File[];
    const imageUrls: string[] = [];

    // Upload photos to S3
    if (photoFiles.length > 0) {
      for (const file of photoFiles) {
        if (file.size > 0) {
          try {
            // Convert File to Buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload to S3
            const url = await uploadToS3(buffer, file.name, file.type);
            imageUrls.push(url);
          } catch (uploadError) {
            console.error("Error uploading image to S3:", uploadError);
            // Continue with other images even if one fails
          }
        }
      }
    }

    // Create the review in the database
    const review = await prisma.review.create({
      data: {
        customerName: customerName.trim(),
        email: email?.trim() || null,
        rating,
        comment: comment.trim(),
        productName: productName?.trim() || null,
        imageUrls,
        approved: false, // Requires admin approval
        verified: true, // User has verified purchase
        featured: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully and is pending approval",
      reviewId: review.id,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch reviews (for admin interface later)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const approved = searchParams.get("approved");

    const where = approved !== null ? { approved: approved === "true" } : {};

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
