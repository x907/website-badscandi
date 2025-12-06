import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET user preferences
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        marketingConsent: true,
        emailSubscriptions: {
          select: { list: true, status: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      marketingConsent: user.marketingConsent,
      subscriptions: user.emailSubscriptions,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PATCH update user preferences
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { marketingConsent } = body as { marketingConsent?: boolean };

    if (typeof marketingConsent !== "boolean") {
      return NextResponse.json(
        { error: "marketingConsent must be a boolean" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { marketingConsent },
      select: {
        marketingConsent: true,
      },
    });

    // If user unsubscribed, update all email subscriptions
    if (!marketingConsent) {
      await db.emailSubscription.updateMany({
        where: { userId: session.user.id },
        data: { status: "unsubscribed" },
      });
    }

    return NextResponse.json({
      success: true,
      marketingConsent: user.marketingConsent,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
