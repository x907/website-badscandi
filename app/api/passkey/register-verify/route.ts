import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyPasskeyRegistration } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { response, expectedChallenge } = body;

    const result = await verifyPasskeyRegistration(
      session.user.id,
      response,
      expectedChallenge
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error verifying registration:", error);
    return NextResponse.json(
      { error: "Failed to verify registration" },
      { status: 500 }
    );
  }
}
