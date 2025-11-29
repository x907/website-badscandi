import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePasskeyRegistrationOptions } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const options = await generatePasskeyRegistrationOptions(
      session.user.id,
      session.user.email
    );

    return NextResponse.json(options);
  } catch (error) {
    console.error("Error generating registration options:", error);
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}
