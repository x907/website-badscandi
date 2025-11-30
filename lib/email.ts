import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function sendMagicLinkEmail(email: string, url: string) {
  const fromEmail = process.env.EMAIL_FROM || "noreply@badscandi.com";

  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Sign in to Bad Scandi",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
                  <h1 style="color: #1a1a1a; margin-bottom: 20px;">Welcome to Bad Scandi</h1>
                  <p style="font-size: 16px; margin-bottom: 30px;">Click the button below to sign in to your account.</p>

                  <a href="${url}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Sign In
                  </a>

                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    This link will expire in 5 minutes.
                  </p>

                  <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="font-size: 12px; color: #999;">
                    Bad Scandi - Handcrafted Fiber Art
                  </p>
                </div>
              </body>
            </html>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Sign in to Bad Scandi\n\nClick the link below to sign in:\n\n${url}\n\nThis link will expire in 5 minutes.\n\nIf you didn't request this email, you can safely ignore it.`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    console.log(`Magic link email sent to ${email}`);
  } catch (error) {
    console.error("Error sending magic link email:", error);
    throw error;
  }
}
