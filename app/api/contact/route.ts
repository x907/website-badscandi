import { NextResponse } from "next/server";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "@/lib/ses-client";
import { checkRateLimit } from "@/lib/rate-limit";

// HTML escape function to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, "contact");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Sanitize inputs for HTML email - escape all user content
    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeSubject = escapeHtml(subject.trim());
    const safeMessage = escapeHtml(message.trim());

    const fromEmail = process.env.EMAIL_FROM || "noreply@badscandi.com";
    const recipientEmail = process.env.CONTACT_EMAIL || "hello@badscandi.com";

    // Send email using AWS SES
    const params = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [recipientEmail],
      },
      ReplyToAddresses: [email],
      Message: {
        Subject: {
          Data: `Contact Form: ${safeSubject}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">New Contact Form Submission</h2>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${safeName}</p>
                      <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${safeEmail}</p>
                      <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${safeSubject}</p>
                    </div>

                    <div style="background-color: white; padding: 20px; border-radius: 6px;">
                      <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
                      <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
                    </div>

                    <p style="font-size: 12px; color: #999; margin-top: 20px;">
                      Submitted: ${new Date().toLocaleString()}
                    </p>
                  </div>
                </body>
              </html>
            `,
            Charset: "UTF-8",
          },
          Text: {
            Data: `New Contact Form Submission\n\nFrom: ${name.trim()}\nEmail: ${email.trim()}\nSubject: ${subject.trim()}\n\nMessage:\n${message.trim()}\n\nSubmitted: ${new Date().toLocaleString()}`,
            Charset: "UTF-8",
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);

    console.log(`Contact form email sent from ${email} (${name})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
