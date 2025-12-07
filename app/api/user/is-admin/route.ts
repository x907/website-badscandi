import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    const userIsAdmin = await isAdmin();
    return NextResponse.json({ isAdmin: userIsAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
