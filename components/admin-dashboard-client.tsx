"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Package,
  Star,
  AlertTriangle,
  TrendingUp,
  Clock,
  Truck,
  ArrowRight,
  RefreshCw,
  PackageX,
  FlaskConical,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";

interface SandboxStatus {
  enabled: boolean;
  stripeMode: "test" | "live";
  easypostMode: "test" | "live";
  emailRedirect: string | null;
}

interface DashboardStats {
  orders: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    needingLabels: number;
    recent: Array<{
      id: string;
      totalCents: number;
      createdAt: string;
      trackingNumber: string | null;
      user: { name: string | null; email: string };
    }>;
  };
  revenue: {
    todayCents: number;
    thisWeekCents: number;
    thisMonthCents: number;
    totalCents: number;
  };
  reviews: {
    pending: number;
    total: number;
  };
  products: {
    lowStock: Array<{ id: string; name: string; stock: number }>;
    outOfStock: number;
    total: number;
  };
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus | null>(null);
  const [isTogglingMode, setIsTogglingMode] = useState(false);

  const fetchSandboxStatus = async () => {
    try {
      const response = await fetch("/api/admin/sandbox");
      if (response.ok) {
        const data = await response.json();
        setSandboxStatus(data);
      }
    } catch (error) {
      console.error("Error fetching sandbox status:", error);
    }
  };

  const toggleSandboxMode = async () => {
    if (!sandboxStatus || isTogglingMode) return;

    // Confirmation dialog with different messages based on direction
    const confirmMessage = sandboxStatus.enabled
      ? "Switch to PRODUCTION mode?\n\nThis will:\n- Use LIVE Stripe keys (real payments)\n- Use PRODUCTION EasyPost (real shipping labels)\n- Send emails to real customers\n\nAre you sure?"
      : "Enable SANDBOX mode?\n\nThis will:\n- Use TEST Stripe keys (no real charges)\n- Use TEST EasyPost (no real labels)\n- Redirect all emails to admin\n- Sandbox orders won't affect inventory\n\nAre you sure?";

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsTogglingMode(true);
    try {
      const response = await fetch("/api/admin/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !sandboxStatus.enabled }),
      });

      if (response.ok) {
        const data = await response.json();
        setSandboxStatus(data.status);
      } else {
        const error = await response.json();
        alert(`Failed to toggle sandbox mode: ${error.message || error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error toggling sandbox mode:", error);
      alert("Failed to toggle sandbox mode");
    } finally {
      setIsTogglingMode(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSandboxStatus();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load dashboard</p>
          <Button onClick={fetchStats} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Sandbox Mode Banner */}
      {sandboxStatus && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            sandboxStatus.enabled
              ? "bg-purple-500/10 border-purple-500/30 dark:bg-purple-500/20 dark:border-purple-500/40"
              : "bg-muted border-border"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  sandboxStatus.enabled ? "bg-purple-500/20" : "bg-muted"
                }`}
              >
                <FlaskConical
                  className={`h-5 w-5 ${
                    sandboxStatus.enabled ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {sandboxStatus.enabled ? "Sandbox Mode Active" : "Production Mode"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sandboxStatus.enabled ? (
                    <>
                      Stripe: {sandboxStatus.stripeMode} | EasyPost:{" "}
                      {sandboxStatus.easypostMode}
                      {sandboxStatus.emailRedirect && (
                        <> | Emails to: {sandboxStatus.emailRedirect}</>
                      )}
                    </>
                  ) : (
                    "Using live API keys - orders are real"
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={toggleSandboxMode}
              disabled={isTogglingMode}
              variant={sandboxStatus.enabled ? "destructive" : "default"}
              className={
                !sandboxStatus.enabled
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : ""
              }
            >
              {isTogglingMode ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Switching...
                </>
              ) : sandboxStatus.enabled ? (
                "Switch to Production"
              ) : (
                "Enable Sandbox Mode"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(stats.reviews.pending > 0 ||
        stats.orders.needingLabels > 0 ||
        stats.products.outOfStock > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.reviews.pending > 0 && (
            <Link
              href="/admin/reviews"
              className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <div className="p-2 bg-amber-100 rounded-full">
                <Star className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  {stats.reviews.pending} pending review
                  {stats.reviews.pending !== 1 && "s"}
                </p>
                <p className="text-sm text-amber-700">Needs moderation</p>
              </div>
              <ArrowRight className="h-5 w-5 text-amber-700" />
            </Link>
          )}

          {stats.orders.needingLabels > 0 && (
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-full">
                <Truck className="h-5 w-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  {stats.orders.needingLabels} order
                  {stats.orders.needingLabels !== 1 && "s"} without labels
                </p>
                <p className="text-sm text-blue-700">Check shipping</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-700" />
            </Link>
          )}

          {stats.products.outOfStock > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="p-2 bg-red-100 rounded-full">
                <PackageX className="h-5 w-5 text-red-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-900">
                  {stats.products.outOfStock} product
                  {stats.products.outOfStock !== 1 && "s"} out of stock
                </p>
                <p className="text-sm text-red-700">Update inventory</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Revenue Today */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Today</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {formatPrice(stats.revenue.todayCents)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.orders.today} order{stats.orders.today !== 1 && "s"}
          </p>
        </div>

        {/* Revenue This Week */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">This Week</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {formatPrice(stats.revenue.thisWeekCents)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.orders.thisWeek} order{stats.orders.thisWeek !== 1 && "s"}
          </p>
        </div>

        {/* Revenue This Month */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">This Month</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {formatPrice(stats.revenue.thisMonthCents)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.orders.thisMonth} order{stats.orders.thisMonth !== 1 && "s"}
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Package className="h-4 w-4" />
            <span className="text-sm font-medium">All Time</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {formatPrice(stats.revenue.totalCents)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.orders.total} order{stats.orders.total !== 1 && "s"}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-sm text-accent hover:text-accent/80 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border">
            {stats.orders.recent.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No orders yet
              </div>
            ) : (
              stats.orders.recent.map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="flex items-center justify-between p-4 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {order.user.name || order.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      #{order.id.slice(-8).toUpperCase()} •{" "}
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {order.trackingNumber ? (
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                        Shipped
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                        Pending
                      </span>
                    )}
                    <span className="font-semibold text-foreground">
                      {formatPrice(order.totalCents)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Stock & Quick Stats */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          {stats.products.lowStock.length > 0 && (
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 sm:p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="font-semibold text-foreground">Low Stock</h2>
                </div>
              </div>
              <div className="divide-y divide-border">
                {stats.products.lowStock.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4"
                  >
                    <p className="font-medium text-foreground truncate flex-1">
                      {product.name}
                    </p>
                    <span
                      className={`text-sm font-semibold ${
                        product.stock === 1
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="font-semibold text-foreground mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Products</span>
                <span className="font-semibold">{stats.products.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Reviews</span>
                <span className="font-semibold">{stats.reviews.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Reviews</span>
                <span className="font-semibold">{stats.reviews.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Orders w/o Labels</span>
                <span className="font-semibold">
                  {stats.orders.needingLabels}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/admin/orders"
                className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <Link
                href="/admin/reviews"
                className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
              >
                <Star className="h-4 w-4" />
                Reviews
              </Link>
              <Link
                href="/shop"
                target="_blank"
                className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium col-span-2"
              >
                View Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
