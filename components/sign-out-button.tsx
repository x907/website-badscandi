"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const { clearCart } = useCart();
  const router = useRouter();

  async function handleSignOut() {
    try {
      setLoading(true);
      // Clear cart before signing out to protect user privacy
      clearCart();
      // Sign out using the auth client
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Still redirect even if there's an error
      router.push("/");
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sign Out
    </Button>
  );
}
