import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasskeyEnroll } from "@/components/passkey-enroll";
import { PasskeyManager } from "@/components/passkey-manager";
import { MarketingPreferences } from "@/components/marketing-preferences";
import { SignOutButton } from "@/components/sign-out-button";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, Fingerprint, Star, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Use Promise.allSettled to handle partial failures gracefully
  const results = await Promise.allSettled([
    db.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.passkey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { marketingConsent: true },
    }),
  ]);

  // Extract values with fallbacks if queries failed
  const orders = results[0].status === "fulfilled" ? results[0].value : [];
  const passkeys = results[1].status === "fulfilled" ? results[1].value : [];
  const user = results[2].status === "fulfilled" ? results[2].value : null;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-1">{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {passkeys.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
            <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Secure Your Account</h3>
            <p className="text-sm text-amber-600 dark:text-amber-300 mb-4">
              Set up a passkey for passwordless authentication using your fingerprint or face.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <PasskeyEnroll />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Your Passkeys
              </CardTitle>
              <CardDescription>
                Manage your registered passkeys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasskeyManager passkeys={passkeys} />
            </CardContent>
          </Card>
        </div>

        <MarketingPreferences initialConsent={user?.marketingConsent ?? false} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order History
            </CardTitle>
            <CardDescription>
              View your past purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders yet</p>
                <a href="/shop" className="text-amber-600 dark:text-amber-400 hover:underline text-sm mt-2 inline-block">
                  Start shopping
                </a>
              </div>
            ) : (
              <ul className="space-y-6">
                {orders.map((order) => {
                  // Handle both JSON string (old orders) and JSON object (new orders)
                  const items = (typeof order.items === 'string'
                    ? JSON.parse(order.items)
                    : order.items) as Array<{
                    id?: string;
                    productId?: string;
                    name: string;
                    priceCents: number;
                    quantity: number;
                    imageUrl: string;
                  }>;

                  return (
                    <li
                      key={order.id}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <div className="bg-muted px-4 py-3 flex items-center justify-between border-b border-border">
                        <div>
                          <p className="font-medium text-foreground">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-amber-600 dark:text-amber-400">
                            {formatPrice(order.totalCents)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-card">
                        <div className="space-y-3 mb-4">
                          {items.map((item, index) => (
                            <div key={index} className="flex gap-3">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded border border-border"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} • {formatPrice(item.priceCents)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-border">
                          <Link href={`/account/orders/${order.id}`} className="flex-1">
                            <Button variant="outline" className="w-full gap-2" size="sm">
                              View Details
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                          {order.status === "completed" && (
                            <Link href="/submit-review" className="flex-1">
                              <Button className="w-full gap-2" size="sm">
                                <Star className="h-4 w-4" />
                                Write Review
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
