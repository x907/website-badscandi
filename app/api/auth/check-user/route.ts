import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Check if a user exists and has passkeys registered
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        passkeys: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        hasPasskey: false,
        emailVerified: false,
      });
    }

    return NextResponse.json({
      exists: true,
      hasPasskey: user.passkeys.length > 0,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: "Failed to check user" },
      { status: 500 }
    );
  }
}
