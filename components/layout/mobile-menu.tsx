"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

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
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <Dialog.Title className="text-lg font-semibold">
              Bad Scandi
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navLinks.map((link) => (
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
          </nav>

          <div className="p-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 text-center">
              Hand-dyed fiber art for your home
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
