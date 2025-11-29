import { NextResponse } from "next/server";
import { verifyPasskeyAuthentication } from "@/lib/webauthn";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { response, expectedChallenge } = body;

    const result = await verifyPasskeyAuthentication(response, expectedChallenge);

    if (result.verified && result.user) {
      const session = await db.session.create({
        data: {
          userId: result.user.id,
          sessionToken: crypto.randomUUID(),
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({
        verified: true,
        sessionToken: session.sessionToken,
      });
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 401 });
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
