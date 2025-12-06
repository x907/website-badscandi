import { baseEmailTemplate } from "./base";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

export interface WinbackEmailData {
  firstName?: string;
  daysSinceLastOrder?: number;
}

// Step 1: We miss you (sent 30 days after last activity)
export function winbackStep1Template(data: WinbackEmailData, _unsubscribeUrl?: string) {
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Hi there";

  const content = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px;">${greeting},</h2>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      It's been a while since we've seen you, and we wanted to check in!
    </p>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      We've been busy crafting new pieces that we think you'll love. Each one is handmade with the same care and attention to detail that makes Bad Scandi special.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/shop" style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        See What's New
      </a>
    </div>

    <p style="font-size: 16px; color: #333; margin: 0 0 8px 0;">
      Why customers love our pieces:
    </p>

    <ul style="font-size: 15px; color: #555; margin: 0 0 24px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Unique, handcrafted designs</li>
      <li style="margin-bottom: 8px;">Premium natural materials</li>
      <li style="margin-bottom: 8px;">Free shipping on every order</li>
      <li style="margin-bottom: 0;">Easy returns within 30 days</li>
    </ul>

    <p style="font-size: 16px; color: #333; margin: 0;">
      We'd love to have you back!
    </p>
  `;

  const html = baseEmailTemplate(content);
  const text = `
${greeting},

It's been a while since we've seen you, and we wanted to check in!

We've been busy crafting new pieces that we think you'll love. Each one is handmade with the same care and attention to detail that makes Bad Scandi special.

See what's new: ${siteUrl}/shop

Why customers love our pieces:
- Unique, handcrafted designs
- Premium natural materials
- Free shipping on every order
- Easy returns within 30 days

We'd love to have you back!

---
Bad Scandi - Handcrafted Fiber Art
Unsubscribe: ${siteUrl}/unsubscribe
`;

  return {
    subject: "We miss you!",
    html,
    text,
  };
}

// Step 2: Final reminder (sent 60 days after last activity)
export function winbackStep2Template(data: WinbackEmailData, _unsubscribeUrl?: string) {
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Hi there";

  const content = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px;">${greeting},</h2>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      We haven't heard from you in a while, and we wanted to make sure you know you're always welcome back.
    </p>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      Our collection of handcrafted fiber art is always growing, with new pieces that bring warmth and texture to any space.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/shop" style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Browse the Collection
      </a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      If you'd rather not hear from us, you can unsubscribe below.
    </p>
  `;

  const html = baseEmailTemplate(content);
  const text = `
${greeting},

We haven't heard from you in a while, and we wanted to make sure you know you're always welcome back.

Our collection of handcrafted fiber art is always growing, with new pieces that bring warmth and texture to any space.

Browse the collection: ${siteUrl}/shop

If you'd rather not hear from us, you can unsubscribe below.

---
Bad Scandi - Handcrafted Fiber Art
Unsubscribe: ${siteUrl}/unsubscribe
`;

  return {
    subject: "Still thinking of you",
    html,
    text,
  };
}
