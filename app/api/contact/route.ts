import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
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
          Data: `Contact Form: ${subject}`,
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
                      <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${name}</p>
                      <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
                      <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
                    </div>

                    <div style="background-color: white; padding: 20px; border-radius: 6px;">
                      <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
                      <p style="margin: 0; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
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
            Data: `New Contact Form Submission\n\nFrom: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\nSubmitted: ${new Date().toLocaleString()}`,
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
