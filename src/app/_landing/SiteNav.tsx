"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CONTACT, NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 text-[0.975rem] font-medium transition-colors hover:bg-mist hover:text-ink", isCurrent(link.href) ? "bg-g-blue-tint text-g-blue" : "text-moss")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-whatsapp px-3.5 font-semibold text-white transition-colors hover:bg-whatsapp-deep sm:px-5">
            <WhatsAppIcon className="size-[1.15rem]" />
            <span className="max-[400px]:sr-only">WhatsApp</span>
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
        <nav id="mobile-menu" aria-label="Main" className="border-t border-line bg-white px-4 py-3 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn("flex min-h-12 items-center rounded-xl px-3 text-lg font-medium hover:bg-mist", isCurrent(link.href) && "bg-g-blue-tint text-g-blue")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
