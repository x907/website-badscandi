import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  plugins: [passkeyClient(), magicLinkClient()],
});

// Export hooks and methods for easy access
export const {
  signIn,
  signOut,
  useSession,
  passkey,
} = authClient;
