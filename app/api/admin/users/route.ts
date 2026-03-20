import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const total = await db.user.count({ where });

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        emailVerified: true,
        marketingConsent: true,
        passkeys: { select: { id: true } },
        orders: {
          select: { totalCents: true },
        },
        accounts: { select: { providerId: true } },
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      emailVerified: u.emailVerified,
      marketingConsent: u.marketingConsent,
      hasPasskey: u.passkeys.length > 0,
      orderCount: u.orders.length,
      totalSpentCents: u.orders.reduce((sum, o) => sum + o.totalCents, 0),
      providers: u.accounts.map((a) => a.providerId),
    }));

    return NextResponse.json({ users: formatted, total, page, limit });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
