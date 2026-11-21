"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CONTACT } from "@/lib/site";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./WhatsAppIcon";

const LINKS = [
  { href: "#kaise", label: "How it works" },
  { href: "#kyun", label: "Why reviews" },
  { href: "#kahani", label: "Story" },
  { href: "#sawaal", label: "FAQ" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition-colors", scrolled || open ? "border-line" : "border-transparent")}>
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" aria-label="Semsorted home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Page sections" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="rounded-full px-4 py-2 text-[0.975rem] font-medium text-moss transition-colors hover:bg-mist hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-whatsapp px-4 font-semibold text-white transition-colors hover:bg-whatsapp-deep sm:px-5">
            <WhatsAppIcon className="size-[1.15rem]" />
            WhatsApp
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
            className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-mist lg:hidden"
          >
            {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Page sections" className="border-t border-line bg-white px-4 py-3 lg:hidden">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-lg font-medium hover:bg-mist">
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
