import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

// Valid event types for the drip system
const EVENT_TYPES = [
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "checkout_started",
  "checkout_completed",
  "order_placed",
  "email_open",
  "email_click",
  "page_view",
  "signup",
] as const;

// Request validation schema
const eventSchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  anonymousId: z.string().optional(),
  properties: z
    .object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      cartId: z.string().optional(),
      orderId: z.string().optional(),
      emailId: z.string().optional(),
      url: z.string().optional(),
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export async function POST(request: Request) {
  // Rate limiting - 60 events per minute
  const rateLimitResponse = await checkRateLimit(request, "events");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Get current user session if logged in
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const body = await request.json();

    // Validate the request body
    const validationResult = eventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid event data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { eventType, anonymousId, properties } = validationResult.data;

    // Must have either userId or anonymousId
    if (!session?.user?.id && !anonymousId) {
      return NextResponse.json(
        { error: "Either user must be logged in or anonymousId must be provided" },
        { status: 400 }
      );
    }

    // Insert the event
    const event = await db.event.create({
      data: {
        userId: session?.user?.id || null,
        anonymousId: session?.user?.id ? null : anonymousId, // Don't store anonymousId if logged in
        eventType,
        properties: (properties || {}) as Prisma.InputJsonValue,
        occurredAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}

// Link anonymous events to a user after signup/login
// Called when a user logs in and we want to associate their pre-signup activity
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { anonymousId } = body as { anonymousId?: string };

    if (!anonymousId) {
      return NextResponse.json({ error: "anonymousId is required" }, { status: 400 });
    }

    // Link all events from this anonymousId to the now-authenticated user
    const result = await db.event.updateMany({
      where: {
        anonymousId,
        userId: null, // Only update events that haven't been claimed
      },
      data: {
        userId: session.user.id,
        // Keep anonymousId for reference
      },
    });

    return NextResponse.json({
      success: true,
      linkedEvents: result.count,
    });
  } catch (error) {
    console.error("Error linking events:", error);
    return NextResponse.json({ error: "Failed to link events" }, { status: 500 });
  }
}
