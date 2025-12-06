"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, User, ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { UserAvatar, getFirstName } from "@/components/user-avatar";

const primaryLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const secondaryLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-0 top-0 h-full w-full max-w-xs bg-white z-50 shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <Dialog.Title className="text-lg font-semibold">
              Bad Scandi
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* User Section */}
          <div className="p-4 border-b border-neutral-100">
            {session?.user ? (
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <UserAvatar
                    name={session.user.name}
                    email={session.user.email}
                    image={session.user.image}
                    size="lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {getFirstName(session.user.name, session.user.email)}
                  </p>
                  <p className="text-xs text-neutral-500">View account</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">Sign In</p>
                  <p className="text-xs text-neutral-500">Access your account</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Link>
            )}
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {/* Shop CTA */}
            <Link
              href="/shop"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 mb-4 bg-amber-50 text-amber-900 rounded-lg font-medium hover:bg-amber-100 transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Shop All Products</span>
            </Link>

            {/* Primary Links */}
            <ul className="space-y-1">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 px-4 text-base font-medium text-neutral-900 hover:bg-neutral-50 hover:text-amber-900 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Secondary Links */}
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <p className="px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                Legal
              </p>
              <ul className="space-y-1">
                {secondaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 px-4 text-sm text-neutral-600 hover:text-amber-900 rounded-lg transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50">
            <p className="text-xs text-neutral-500 text-center">
              Hand-dyed fiber art for your home
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
