"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function PanelNav({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Restaurant" className="sticky top-0 z-20 border-b border-line bg-paper">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-1.5 sm:px-4">
        {tabs.map((tab) => {
          const current = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn("inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold", current ? "bg-night text-white" : "text-moss hover:bg-mist hover:text-ink")}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    await fetch("/api/staff/logout", { method: "POST" }).catch(() => {});
    router.replace("/restaurant/login");
    router.refresh();
  };
  return (
    <button type="button" onClick={logout} disabled={busy} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white/85 ring-1 ring-white/30 hover:bg-white/10 disabled:opacity-60">
      <LogOut aria-hidden className="size-4" /> Log out
    </button>
  );
}
