import { baseEmailTemplate } from "./base";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

export interface OrderItem {
  name: string;
  priceCents: number;
  quantity: number;
  imageUrl: string;
}

export interface OrderConfirmationEmailData {
  firstName?: string;
  orderId: string;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function orderConfirmationTemplate(data: OrderConfirmationEmailData, _unsubscribeUrl?: string) {
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Hi there";
  const orderNumber = data.orderId.slice(0, 8).toUpperCase();

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="70">
                <img src="${item.imageUrl}" alt="${item.name}" width="60" height="60" style="border-radius: 4px; object-fit: cover;" />
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${item.name}</p>
                <p style="margin: 4px 0 0 0; color: #666; font-size: 13px;">Qty: ${item.quantity}</p>
              </td>
              <td align="right" style="color: #1a1a1a; font-weight: 500; font-size: 14px;">
                ${formatPrice(item.priceCents * item.quantity)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    )
    .join("");

  const shippingHtml = data.shippingAddress
    ? `
    <div style="margin-top: 24px; padding: 16px; background-color: #f8f9fa; border-radius: 6px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">Shipping to:</p>
      <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">
        ${data.shippingAddress.name ? `${data.shippingAddress.name}<br/>` : ""}
        ${data.shippingAddress.line1 ? `${data.shippingAddress.line1}<br/>` : ""}
        ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br/>` : ""}
        ${data.shippingAddress.city ? `${data.shippingAddress.city}, ` : ""}${data.shippingAddress.state || ""} ${data.shippingAddress.postal_code || ""}<br/>
        ${data.shippingAddress.country || ""}
      </p>
    </div>
  `
    : "";

  const content = `
    <h2 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 22px;">Thank you for your order!</h2>
    <p style="color: #666; margin: 0 0 24px 0; font-size: 14px;">Order #${orderNumber}</p>

    <p style="font-size: 16px; color: #333; margin: 0 0 24px 0;">
      ${greeting}, thank you for shopping with Bad Scandi! We're preparing your handcrafted piece with care.
    </p>

    <!-- Order Items -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 16px 0;">
      ${itemsHtml}
    </table>

    <!-- Order Total -->
    <div style="padding: 16px 0; border-top: 2px solid #1a1a1a;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-size: 14px; color: #666;">Subtotal</td>
          <td align="right" style="font-size: 14px; color: #1a1a1a;">${formatPrice(data.subtotalCents)}</td>
        </tr>
        <tr>
          <td style="font-size: 14px; color: #666; padding-top: 8px;">Shipping</td>
          <td align="right" style="font-size: 14px; color: #1a1a1a; padding-top: 8px;">${data.shippingCents === 0 ? "Free" : formatPrice(data.shippingCents)}</td>
        </tr>
        <tr>
          <td style="font-size: 16px; font-weight: 700; color: #1a1a1a; padding-top: 12px;">Total</td>
          <td align="right" style="font-size: 16px; font-weight: 700; color: #78350f; padding-top: 12px;">${formatPrice(data.totalCents)}</td>
        </tr>
      </table>
    </div>

    ${shippingHtml}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/account" style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Order Details
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin: 0;">
      We'll send you a shipping confirmation email when your order is on its way.
    </p>

    <p style="font-size: 14px; color: #666; margin: 16px 0 0 0;">
      Questions? Just reply to this email - we're here to help!
    </p>
  `;

  const html = baseEmailTemplate(content);
  const text = `
Thank you for your order!
Order #${orderNumber}

${greeting}, thank you for shopping with Bad Scandi! We're preparing your handcrafted piece with care.

Order Summary:
${data.items.map((item) => `- ${item.name} (Qty: ${item.quantity}) - ${formatPrice(item.priceCents * item.quantity)}`).join("\n")}

Subtotal: ${formatPrice(data.subtotalCents)}
Shipping: ${data.shippingCents === 0 ? "Free" : formatPrice(data.shippingCents)}
Total: ${formatPrice(data.totalCents)}

${
  data.shippingAddress
    ? `Shipping to:
${data.shippingAddress.name || ""}
${data.shippingAddress.line1 || ""}
${data.shippingAddress.line2 || ""}
${data.shippingAddress.city || ""}, ${data.shippingAddress.state || ""} ${data.shippingAddress.postal_code || ""}
${data.shippingAddress.country || ""}`
    : ""
}

View order details: ${siteUrl}/account

We'll send you a shipping confirmation email when your order is on its way.

Questions? Just reply to this email - we're here to help!

---
Bad Scandi - Handcrafted Fiber Art
`;

  return {
    subject: `Order Confirmed - #${orderNumber}`,
    html,
    text,
  };
}
