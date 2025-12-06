import { baseEmailTemplate } from "./base";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

export interface ReviewRequestEmailData {
  firstName?: string;
  orderId: string;
  items: Array<{
    name: string;
    imageUrl: string;
    productId?: string;
  }>;
}

export function reviewRequestTemplate(data: ReviewRequestEmailData, _unsubscribeUrl?: string) {
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Hi there";

  const itemsHtml = data.items
    .map(
      (item) => `
      <div style="text-align: center; margin: 16px 0;">
        <img src="${item.imageUrl}" alt="${item.name}" width="120" height="120" style="border-radius: 8px; object-fit: cover; margin-bottom: 8px;" />
        <p style="margin: 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${item.name}</p>
      </div>
    `
    )
    .join("");

  const content = `
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px;">${greeting},</h2>

    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
      We hope you're loving your new piece from Bad Scandi! Your handcrafted fiber art should have arrived by now.
    </p>

    <p style="font-size: 16px; color: #333; margin: 0 0 24px 0;">
      Would you take a moment to share your thoughts? Your review helps other customers discover our work and helps us continue to improve.
    </p>

    ${itemsHtml}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/submit-review" style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Write a Review
      </a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      Have questions or concerns? Simply reply to this email - we're here to help!
    </p>
  `;

  const html = baseEmailTemplate(content);
  const text = `
${greeting},

We hope you're loving your new piece from Bad Scandi! Your handcrafted fiber art should have arrived by now.

Would you take a moment to share your thoughts? Your review helps other customers discover our work and helps us continue to improve.

Your recent purchase:
${data.items.map((item) => `- ${item.name}`).join("\n")}

Write a review: ${siteUrl}/submit-review

Have questions or concerns? Simply reply to this email - we're here to help!

---
Bad Scandi - Handcrafted Fiber Art
`;

  return {
    subject: "How are you enjoying your new piece?",
    html,
    text,
  };
}
