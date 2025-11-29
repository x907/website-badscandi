import { NextResponse } from "next/server";
import { generatePasskeyAuthenticationOptions } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const options = await generatePasskeyAuthenticationOptions(email);

    return NextResponse.json(options);
  } catch (error) {
    console.error("Error generating authentication options:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 }
    );
  }
}
