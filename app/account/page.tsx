import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasskeyEnroll } from "@/components/passkey-enroll";
import { PasskeyManager } from "@/components/passkey-manager";
import { formatPrice, formatDate } from "@/lib/utils";
import { LogOut, Package, Fingerprint, Star, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const [orders, passkeys] = await Promise.all([
    db.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.passkey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  async function handleSignOut() {
    "use server";
    await auth.api.signOut({
      headers: await headers(),
    });
    redirect("/");
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-neutral-600 mt-1">{session.user.email}</p>
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" type="submit" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>

        {passkeys.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-amber-900 mb-2">Secure Your Account</h3>
            <p className="text-sm text-amber-800 mb-4">
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
                <p className="text-neutral-600">No orders yet</p>
                <a href="/shop" className="text-amber-900 hover:underline text-sm mt-2 inline-block">
                  Start shopping
                </a>
              </div>
            ) : (
              <ul className="space-y-6">
                {orders.map((order) => {
                  const items = JSON.parse(order.items as string) as Array<{
                    id: string;
                    name: string;
                    priceCents: number;
                    quantity: number;
                    imageUrl: string;
                  }>;

                  return (
                    <li
                      key={order.id}
                      className="border border-neutral-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-b border-neutral-200">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-neutral-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-amber-900">
                            {formatPrice(order.totalCents)}
                          </p>
                          <p className="text-xs text-neutral-600 capitalize">{order.status}</p>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="space-y-3 mb-4">
                          {items.map((item, index) => (
                            <div key={index} className="flex gap-3">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded border border-neutral-200"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-neutral-600">
                                  Qty: {item.quantity} • {formatPrice(item.priceCents)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-neutral-100">
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
