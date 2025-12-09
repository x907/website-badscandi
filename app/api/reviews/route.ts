import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

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
    const completedOrders = await db.order.findMany({
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

    // Create the review in the database
    const review = await db.review.create({
      data: {
        customerName: customerName.trim(),
        email: email?.trim() || null,
        rating,
        comment: comment.trim(),
        productName: productName?.trim() || null,
        imageUrls: [], // Photo uploads disabled
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

// GET endpoint to fetch reviews
// Public access only returns approved reviews with pagination
// Admin access returns all reviews based on filter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const approved = searchParams.get("approved");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Check if user is admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Determine filter based on auth status
    let where: { approved?: boolean } = {};

    if (session?.user?.id) {
      // Check admin status for authenticated users
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      });

      if (user?.isAdmin) {
        // Admin can filter by approved status or see all
        if (approved !== null) {
          where = { approved: approved === "true" };
        }
        // If no filter, admin sees all reviews
      } else {
        // Non-admin authenticated users only see approved
        where = { approved: true };
      }
    } else {
      // Unauthenticated users only see approved reviews
      where = { approved: true };
    }

    // Get total count for pagination
    const total = await db.review.count({ where });

    const reviews = await db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        productName: true,
        imageUrls: true,
        approved: true,
        verified: true,
        featured: true,
        createdAt: true,
        // Don't expose email to public
        ...(session?.user?.id ? { email: true } : {}),
      },
    });

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
