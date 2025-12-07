"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export function useIsAdmin() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // Check admin status
    fetch("/api/user/is-admin")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.isAdmin ?? false);
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [session?.user]);

  return { isAdmin, isLoading };
}
