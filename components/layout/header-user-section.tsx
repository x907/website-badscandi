"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAvatar, getFirstName } from "@/components/user-avatar";
import { useSession } from "@/lib/auth-client";

export function HeaderUserSection() {
  const { data: session, isPending } = useSession();

  // Show nothing while loading to prevent layout shift
  if (isPending) {
    return (
      <div className="h-9 w-9 rounded-full bg-neutral-100 animate-pulse" />
    );
  }

  if (session?.user) {
    const firstName = getFirstName(session.user.name, session.user.email);

    return (
      <Link href="/account" className="flex items-center gap-2">
        <UserAvatar
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
          size="md"
        />
        <span className="hidden lg:block text-sm font-medium text-neutral-700">
          {firstName}
        </span>
      </Link>
    );
  }

  return (
    <Link href="/auth/signin">
      <Button variant="outline" size="sm">
        Sign In
      </Button>
    </Link>
  );
}
