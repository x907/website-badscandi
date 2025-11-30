import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { magicLink } from "better-auth/plugins";
import { db } from "./db";
import { sendMagicLinkEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false, // We only use social + passkeys
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
      enabled: !!process.env.APPLE_CLIENT_ID,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      enabled: !!process.env.FACEBOOK_CLIENT_ID,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      enabled: !!process.env.MICROSOFT_CLIENT_ID,
    },
  },
  plugins: [
    passkey({
      rpName: process.env.RP_NAME || "Bad Scandi",
      rpID: process.env.RP_ID || "localhost",
      origin: process.env.RP_ORIGIN || "http://localhost:3000",
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
  advanced: {
    // Allow email account linking (equivalent to allowDangerousEmailAccountLinking)
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  trustedOrigins: [
    process.env.RP_ORIGIN || "http://localhost:3000",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ],
});

// Export types for TypeScript
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
