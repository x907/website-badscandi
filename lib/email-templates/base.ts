// Base email template wrapper with consistent styling
// All drip emails use this wrapper for brand consistency
import { createHmac } from "crypto";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

// Generate unsubscribe token for a user
export function generateUnsubscribeToken(userId: string, email: string): string {
  // Use dedicated secret for email tokens, fall back to CRON_SHARED_SECRET for backwards compatibility
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CRON_SHARED_SECRET;
  if (!secret) {
    throw new Error("EMAIL_UNSUBSCRIBE_SECRET environment variable is required for email security");
  }
  const data = `${userId}:${email}`;
  return createHmac("sha256", secret).update(data).digest("hex").slice(0, 32);
}

// Build unsubscribe URL with token
export function buildUnsubscribeUrl(userId: string, email: string): string {
  const token = generateUnsubscribeToken(userId, email);
  return `${siteUrl}/unsubscribe?userId=${userId}&email=${encodeURIComponent(email)}&token=${token}`;
}

export interface BaseTemplateOptions {
  userId?: string;
  email?: string;
}

export function baseEmailTemplate(content: string, options?: BaseTemplateOptions): string {
  // Build unsubscribe URL - use tokenized link if we have user info, otherwise generic
  const unsubscribeUrl = options?.userId && options?.email
    ? buildUnsubscribeUrl(options.userId, options.email)
    : `${siteUrl}/unsubscribe`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bad Scandi</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
        <a href="${siteUrl}" style="text-decoration: none;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">BAD SCANDI</h1>
        </a>
      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 13px; color: #666; margin: 0 0 8px 0;">
          Bad Scandi - Handcrafted Fiber Art
        </p>
        <p style="font-size: 12px; color: #999; margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
          &nbsp;|&nbsp;
          <a href="${siteUrl}/privacy" style="color: #999; text-decoration: underline;">Privacy Policy</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;
}

// Helper to create plain text version from HTML content
// Uses character-by-character parsing to safely extract text
export function stripHtml(html: string): string {
  const result: string[] = [];
  let inTag = false;
  let inScript = false;
  let inStyle = false;
  let tagBuffer = "";

  for (let i = 0; i < html.length; i++) {
    const char = html[i];

    if (char === "<") {
      inTag = true;
      tagBuffer = "";
    } else if (char === ">" && inTag) {
      inTag = false;
      const tagLower = tagBuffer.toLowerCase();

      // Track script/style tags to skip their content
      if (tagLower.startsWith("script")) {
        inScript = true;
      } else if (tagLower === "/script") {
        inScript = false;
      } else if (tagLower.startsWith("style")) {
        inStyle = true;
      } else if (tagLower === "/style") {
        inStyle = false;
      }

      // Add space for block-level tags
      if (tagLower.startsWith("/") || tagLower.startsWith("br") || tagLower.startsWith("p") || tagLower.startsWith("div")) {
        result.push(" ");
      }

      tagBuffer = "";
    } else if (inTag) {
      tagBuffer += char;
    } else if (!inScript && !inStyle) {
      // Only add text content outside of script/style tags
      result.push(char);
    }
  }

  // Clean up whitespace and decode common HTML entities
  // IMPORTANT: Decode &amp; LAST to prevent double-unescaping
  // (e.g., &amp;nbsp; -> &nbsp; -> space would be wrong)
  return result
    .join("")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
