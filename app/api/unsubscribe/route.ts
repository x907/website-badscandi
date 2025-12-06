import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateUnsubscribeToken } from "@/lib/email-templates/base";

// Verify unsubscribe token
function verifyUnsubscribeToken(userId: string, email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(userId, email);
  return token === expectedToken;
}

// POST: Unsubscribe a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, token, list } = body as {
      userId?: string;
      email?: string;
      token?: string;
      list?: string; // Optional: specific list to unsubscribe from
    };

    // Require userId, email, and token for verification
    if (!userId || !email || !token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the token
    if (!verifyUnsubscribeToken(userId, email, token)) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (list) {
      // Unsubscribe from specific list
      await db.emailSubscription.upsert({
        where: {
          userId_list: { userId, list },
        },
        update: {
          status: "unsubscribed",
        },
        create: {
          userId,
          list,
          status: "unsubscribed",
        },
      });
    } else {
      // Unsubscribe from all marketing emails
      await db.user.update({
        where: { id: userId },
        data: { marketingConsent: false },
      });

      // Also update all email subscriptions to unsubscribed
      await db.emailSubscription.updateMany({
        where: { userId },
        data: { status: "unsubscribed" },
      });
    }

    return NextResponse.json({
      success: true,
      message: list
        ? `Unsubscribed from ${list}`
        : "Unsubscribed from all marketing emails",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

// GET: Get unsubscribe status (for page load)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");

  if (!userId || !email || !token) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  if (!verifyUnsubscribeToken(userId, email, token)) {
    return NextResponse.json(
      { error: "Invalid unsubscribe token" },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      marketingConsent: true,
      emailSubscriptions: {
        select: { list: true, status: true },
      },
    },
  });

  if (!user || user.email !== email) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    email: user.email,
    marketingConsent: user.marketingConsent,
    subscriptions: user.emailSubscriptions,
  });
}
