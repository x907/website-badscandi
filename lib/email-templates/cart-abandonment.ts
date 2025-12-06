import { baseEmailTemplate } from "./base";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

export interface CartItem {
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
}

export interface CartAbandonmentEmailData {
  firstName?: string;
  items: CartItem[];
  cartId: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Step 1: Gentle reminder (sent 1-4 hours after abandonment)
export function cartAbandonmentStep1Template(data: CartAbandonmentEmailData, _unsubscribeUrl?: string) {
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Hi there";
  const totalCents = data.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="80">
                <img src="${item.imageUrl}" alt="${item.name}" width="70" height="70" style="border-radius: 4px; object-fit: cover;" />
              </td>
              <td style="padding-left: 16px;">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${item.name}</p>
                <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Qty: ${item.quantity}</p>
              </td>
              <td align="right" style="color: #78350f; font-weight: 600;">
                ${formatPrice(item.priceCents * item.quantity)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    )
    .join("");

  const content = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px;">${greeting},</h2>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      You left something beautiful behind! Your handcrafted fiber art is waiting for you.
    </p>

    <!-- Cart Items -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0; background-color: #fafafa; border-radius: 8px; padding: 16px;">
      ${itemsHtml}
      <tr>
        <td style="padding-top: 16px;" colspan="2">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-weight: 600; font-size: 16px; color: #1a1a1a;">Total</td>
              <td align="right" style="font-weight: 700; font-size: 18px; color: #78350f;">${formatPrice(totalCents)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/cart?recover=${data.cartId}" style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Complete Your Order
      </a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      Free shipping on all orders
    </p>
  `;

  const html = baseEmailTemplate(content);
  const text = `
${greeting},

You left something beautiful behind! Your handcrafted fiber art is waiting for you.

Your Cart:
${data.items.map((item) => `- ${item.name} (Qty: ${item.quantity}) - ${formatPrice(item.priceCents * item.quantity)}`).join("\n")}

Total: ${formatPrice(totalCents)}

Complete your order: ${siteUrl}/cart?recover=${data.cartId}

Free shipping on all orders!

---
Bad Scandi - Handcrafted Fiber Art
Unsubscribe: ${siteUrl}/unsubscribe
`;

  return {
    subject: "You left something behind...",
    html,
    text,
  };
}

// Step 2: Second reminder (sent 24 hours after abandonment)
export function cartAbandonmentStep2Template(data: CartAbandonmentEmailData, _unsubscribeUrl?: string) {
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Hi there";
  const totalCents = data.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="80">
                <img src="${item.imageUrl}" alt="${item.name}" width="70" height="70" style="border-radius: 4px; object-fit: cover;" />
              </td>
              <td style="padding-left: 16px;">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${item.name}</p>
                <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Qty: ${item.quantity}</p>
              </td>
              <td align="right" style="color: #78350f; font-weight: 600;">
                ${formatPrice(item.priceCents * item.quantity)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    )
    .join("");

  const content = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px;">${greeting},</h2>

    <p style="font-size: 16px; color: #333; margin: 0 0 12px 0;">
      Your handcrafted piece is still available, but these unique items tend to go fast!
    </p>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      Each piece is one-of-a-kind - once it's gone, it's gone forever.
    </p>

    <!-- Cart Items -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0; background-color: #fafafa; border-radius: 8px; padding: 16px;">
      ${itemsHtml}
      <tr>
        <td style="padding-top: 16px;" colspan="2">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-weight: 600; font-size: 16px; color: #1a1a1a;">Total</td>
              <td align="right" style="font-weight: 700; font-size: 18px; color: #78350f;">${formatPrice(totalCents)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/cart?recover=${data.cartId}" style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Complete Your Order
      </a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center; margin: 0 0 8px 0;">
      Questions? Just reply to this email.
    </p>
    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      Free shipping included
    </p>
  `;

  const html = baseEmailTemplate(content);
  const text = `
${greeting},

Your handcrafted piece is still available, but these unique items tend to go fast!

Each piece is one-of-a-kind - once it's gone, it's gone forever.

Your Cart:
${data.items.map((item) => `- ${item.name} (Qty: ${item.quantity}) - ${formatPrice(item.priceCents * item.quantity)}`).join("\n")}

Total: ${formatPrice(totalCents)}

Complete your order: ${siteUrl}/cart?recover=${data.cartId}

Questions? Just reply to this email.
Free shipping included!

---
Bad Scandi - Handcrafted Fiber Art
Unsubscribe: ${siteUrl}/unsubscribe
`;

  return {
    subject: "Your handcrafted piece is still waiting",
    html,
    text,
  };
}
