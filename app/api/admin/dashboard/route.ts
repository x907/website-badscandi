import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all stats in parallel
    const [
      // Orders stats
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      totalOrders,
      recentOrders,
      ordersNeedingLabels,

      // Revenue stats
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      totalRevenue,

      // Reviews stats
      pendingReviews,
      totalReviews,

      // Products stats
      lowStockProducts,
      outOfStockProducts,
      totalProducts,
    ] = await Promise.all([
      // Orders counts
      db.order.count({ where: { createdAt: { gte: startOfToday } } }),
      db.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.order.count(),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          totalCents: true,
          createdAt: true,
          trackingNumber: true,
          user: { select: { name: true, email: true } },
        },
      }),
      db.order.count({
        where: {
          trackingNumber: null,
          labelRefunded: false,
        },
      }),

      // Revenue aggregations
      db.order.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { totalCents: true },
      }),
      db.order.aggregate({
        where: { createdAt: { gte: startOfWeek } },
        _sum: { totalCents: true },
      }),
      db.order.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalCents: true },
      }),
      db.order.aggregate({
        _sum: { totalCents: true },
      }),

      // Reviews
      db.review.count({ where: { approved: false } }),
      db.review.count(),

      // Products
      db.product.findMany({
        where: { stock: { gt: 0, lte: 3 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: "asc" },
      }),
      db.product.count({ where: { stock: 0 } }),
      db.product.count(),
    ]);

    return NextResponse.json({
      orders: {
        today: ordersToday,
        thisWeek: ordersThisWeek,
        thisMonth: ordersThisMonth,
        total: totalOrders,
        needingLabels: ordersNeedingLabels,
        recent: recentOrders,
      },
      revenue: {
        todayCents: revenueToday._sum.totalCents || 0,
        thisWeekCents: revenueThisWeek._sum.totalCents || 0,
        thisMonthCents: revenueThisMonth._sum.totalCents || 0,
        totalCents: totalRevenue._sum.totalCents || 0,
      },
      reviews: {
        pending: pendingReviews,
        total: totalReviews,
      },
      products: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        total: totalProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
