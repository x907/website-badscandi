import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting - 3 review submissions per hour
  const rateLimitResponse = await checkRateLimit(request, "reviewSubmit");
  if (rateLimitResponse) return rateLimitResponse;

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

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify the user has purchased this product - single query to fetch all completed orders
    const completedOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: "completed",
      },
      select: {
        id: true,
        items: true,
      },
    });

    if (completedOrders.length === 0) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 }
      );
    }

    // Check if product is in any order - single loop through all orders
    let hasPurchased = false;
    for (const order of completedOrders) {
      let orderItems: Array<{ id?: string; productId?: string }>;
      try {
        orderItems = typeof order.items === "string"
          ? JSON.parse(order.items)
          : (order.items as Array<{ id?: string; productId?: string }>);
      } catch {
        console.error("Failed to parse order items for order:", order.id);
        continue;
      }
      if (orderItems.some((item) => item.id === productId || item.productId === productId)) {
        hasPurchased = true;
        break;
      }
    }

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 }
      );
    }

    // Get photo files (if any)
    const photoFiles = formData.getAll("photos") as File[];
    const imageUrls: string[] = [];

    // File upload limits
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
    const MAX_FILES = 5;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    // Validate file count
    if (photoFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} photos allowed` },
        { status: 400 }
      );
    }

    // Upload photos to S3
    if (photoFiles.length > 0) {
      for (const file of photoFiles) {
        if (file.size > 0) {
          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: `File "${file.name}" exceeds maximum size of 5MB` },
              { status: 400 }
            );
          }

          // Validate file type
          if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
              { error: `File "${file.name}" has invalid type. Allowed: JPEG, PNG, WebP, GIF` },
              { status: 400 }
            );
          }
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
