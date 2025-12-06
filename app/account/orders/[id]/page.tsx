import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, Star, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface OrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const order = await db.order.findUnique({
    where: {
      id,
      userId: session.user.id, // Ensure user can only view their own orders
    },
  });

  if (!order) {
    notFound();
  }

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
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/account">
          <Button variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-neutral-600 mt-1">Order #{order.id.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-900">
              {formatPrice(order.totalCents)}
            </p>
            <p className="text-sm text-neutral-600 capitalize mt-1">{order.status}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Order Date:</span>
              <span className="font-medium">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Order ID:</span>
              <span className="font-medium font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Payment ID:</span>
              <span className="font-medium font-mono text-xs">{order.stripeId}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items ({items.length})
            </CardTitle>
            <CardDescription>
              Click on any product to view details or write a review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 rounded-lg overflow-hidden"
                >
                  <div className="grid md:grid-cols-[200px_1fr] gap-6 p-4">
                    <Link href={`/product/${item.id}`} className="group">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full aspect-square object-cover rounded border border-neutral-200 group-hover:opacity-80 transition-opacity"
                      />
                    </Link>

                    <div className="flex flex-col justify-between">
                      <div>
                        <Link href={`/product/${item.id}`}>
                          <h3 className="text-lg font-semibold hover:text-amber-900 transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                          <span>Quantity: {item.quantity}</span>
                          <span>•</span>
                          <span className="font-medium text-neutral-900">
                            {formatPrice(item.priceCents)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-neutral-600">
                          Subtotal: {formatPrice(item.priceCents * item.quantity)}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Link href={`/product/${item.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            View Product
                          </Button>
                        </Link>
                        {order.status === "completed" && (
                          <Link href={`/submit-review?product=${item.id}`} className="flex-1">
                            <Button className="w-full gap-2" size="sm">
                              <Star className="h-4 w-4" />
                              Write Review
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Subtotal:</span>
              <span className="font-medium">{formatPrice(order.totalCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Shipping:</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="border-t border-neutral-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-amber-900 text-lg">
                  {formatPrice(order.totalCents)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.status === "completed" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-amber-900 mb-2">Share Your Experience</h3>
            <p className="text-sm text-amber-800 mb-4">
              We'd love to hear about your purchase! Write a review to help other customers.
            </p>
            <Link href="/submit-review">
              <Button className="gap-2">
                <Star className="h-4 w-4" />
                Write a Review
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
