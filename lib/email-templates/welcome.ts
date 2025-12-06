import { baseEmailTemplate } from "./base";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

export interface WelcomeEmailData {
  firstName?: string;
}

export function welcomeEmailTemplate(data: WelcomeEmailData, unsubscribeUrl?: string) {
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Welcome";

  const content = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px;">${greeting},</h2>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      Thank you for joining Bad Scandi! We're thrilled to have you as part of our community of fiber art enthusiasts.
    </p>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      Every piece in our collection is handcrafted with care, bringing Scandinavian-inspired warmth to your home.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/shop" style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Explore Our Collection
      </a>
    </div>

    <p style="font-size: 16px; color: #333; margin: 0 0 8px 0;">
      What makes our pieces special:
    </p>

    <ul style="font-size: 15px; color: #555; margin: 0 0 24px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">100% handmade with premium natural fibers</li>
      <li style="margin-bottom: 8px;">Scandinavian-inspired minimalist design</li>
      <li style="margin-bottom: 8px;">Each piece is one-of-a-kind</li>
      <li style="margin-bottom: 0;">Free shipping on all orders</li>
    </ul>

    <p style="font-size: 16px; color: #333; margin: 0;">
      Have questions? Simply reply to this email - we'd love to hear from you!
    </p>
  `;

  const html = baseEmailTemplate(content);
  const text = `
${greeting},

Thank you for joining Bad Scandi! We're thrilled to have you as part of our community of fiber art enthusiasts.

Every piece in our collection is handcrafted with care, bringing Scandinavian-inspired warmth to your home.

Explore our collection: ${siteUrl}/shop

What makes our pieces special:
- 100% handmade with premium natural fibers
- Scandinavian-inspired minimalist design
- Each piece is one-of-a-kind
- Free shipping on all orders

Have questions? Simply reply to this email - we'd love to hear from you!

---
Bad Scandi - Handcrafted Fiber Art
Unsubscribe: ${siteUrl}/unsubscribe
`;

  return {
    subject: "Welcome to Bad Scandi!",
    html,
    text,
  };
}
