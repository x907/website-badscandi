"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Package,
  Truck,
  ExternalLink,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  imageUrl: string;
}

interface ShippingAddress {
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

interface Order {
  id: string;
  stripeId: string;
  totalCents: number;
  shippingCents: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
  customerEmail: string | null;
  shippingAddress: ShippingAddress | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  carrier: string | null;
  shippingService: string | null;
  labelCostCents: number | null;
  shipmentId: string | null;
  labelRefunded: boolean;
  user: {
    name: string | null;
    email: string;
  };
}

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refundingLabel, setRefundingLabel] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/orders");
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefundLabel = async (orderId: string) => {
    if (
      !confirm(
        "Are you sure you want to refund this shipping label? This cannot be undone."
      )
    ) {
      return;
    }

    setRefundingLabel(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund-label`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        alert(`Label refund ${data.status}. ${data.message}`);
        fetchOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error refunding label:", error);
      alert("Failed to refund label");
    } finally {
      setRefundingLabel(null);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-neutral-600">
            View orders, tracking info, and manage shipping labels
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="text-sm text-neutral-600">Total Orders</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="text-sm text-neutral-600">With Labels</div>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.trackingNumber).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="text-sm text-neutral-600">Total Revenue</div>
            <div className="text-2xl font-bold">
              {formatPrice(orders.reduce((sum, o) => sum + o.totalCents, 0))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-12 text-neutral-600">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <p className="text-neutral-600">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-neutral-200 overflow-hidden"
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-mono text-sm text-neutral-500">
                          #{order.id.slice(-8).toUpperCase()}
                        </div>
                        <div className="font-semibold">
                          {order.user.name || order.user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Status Badges */}
                      <div className="flex gap-2">
                        {order.trackingNumber && !order.labelRefunded && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Label Ready
                          </span>
                        )}
                        {order.labelRefunded && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Label Refunded
                          </span>
                        )}
                        {!order.trackingNumber && !order.labelRefunded && (
                          <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                            No Label
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">
                          {formatPrice(order.totalCents)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-neutral-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold mb-3">Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-white p-2 rounded border border-neutral-200"
                            >
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-12 w-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {item.name}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  Qty: {item.quantity} x{" "}
                                  {formatPrice(item.priceCents)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-neutral-200 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Shipping</span>
                            <span>{formatPrice(order.shippingCents)}</span>
                          </div>
                          <div className="flex justify-between font-semibold mt-1">
                            <span>Total</span>
                            <span>{formatPrice(order.totalCents)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Shipping & Tracking */}
                      <div>
                        <h4 className="font-semibold mb-3">Shipping</h4>

                        {order.shippingAddress && (
                          <div className="bg-white p-3 rounded border border-neutral-200 mb-4">
                            <div className="text-sm">
                              <div className="font-medium">
                                {order.shippingAddress.name}
                              </div>
                              {order.shippingAddress.address && (
                                <>
                                  <div>{order.shippingAddress.address.line1}</div>
                                  {order.shippingAddress.address.line2 && (
                                    <div>{order.shippingAddress.address.line2}</div>
                                  )}
                                  <div>
                                    {order.shippingAddress.address.city},{" "}
                                    {order.shippingAddress.address.state}{" "}
                                    {order.shippingAddress.address.postal_code}
                                  </div>
                                  <div>{order.shippingAddress.address.country}</div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {order.trackingNumber && (
                          <div className="bg-white p-3 rounded border border-neutral-200 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-600">Carrier</span>
                              <span className="font-medium">
                                {order.carrier} {order.shippingService}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-600">Tracking</span>
                              <span className="font-mono">{order.trackingNumber}</span>
                            </div>
                            {order.labelCostCents && (
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-600">Label Cost</span>
                                <span>{formatPrice(order.labelCostCents)}</span>
                              </div>
                            )}

                            <div className="flex gap-2 pt-2 border-t border-neutral-200">
                              {order.labelUrl && !order.labelRefunded && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(order.labelUrl!, "_blank");
                                  }}
                                >
                                  <Package className="h-3 w-3" />
                                  Download Label
                                </Button>
                              )}
                              {order.trackingUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(order.trackingUrl!, "_blank");
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Track
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Refund Label Button */}
                        {order.shipmentId && !order.labelRefunded && (
                          <div className="mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefundLabel(order.id);
                              }}
                              disabled={refundingLabel === order.id}
                            >
                              {refundingLabel === order.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Refunding...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Refund Label
                                </>
                              )}
                            </Button>
                            <p className="text-xs text-neutral-500 mt-1">
                              Cancel unused label for refund (5-7 days)
                            </p>
                          </div>
                        )}

                        {order.labelRefunded && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                            Label has been refunded. You may need to purchase a new
                            label manually if reshipping.
                          </div>
                        )}

                        {/* Customer Info */}
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2 text-sm">Customer</h4>
                          <div className="text-sm text-neutral-600">
                            <div>{order.user.email}</div>
                            {order.customerEmail &&
                              order.customerEmail !== order.user.email && (
                                <div>Checkout email: {order.customerEmail}</div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
