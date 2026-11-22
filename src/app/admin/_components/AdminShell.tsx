"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, ChartNoAxesCombined, LayoutDashboard, LogOut, Plus, Store } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: LayoutDashboard, tint: "bg-g-blue text-white" },
  { href: "/admin/attention", label: "Needs attention", short: "Attention", icon: BellRing, tint: "bg-g-red text-white" },
  { href: "/admin/tracking", label: "Tracking", short: "Tracking", icon: ChartNoAxesCombined, tint: "bg-g-green text-white" },
  { href: "/admin/shops", label: "Businesses", short: "Business", icon: Store, tint: "bg-g-yellow text-ink" },
];

function SignOut({ className }: { className?: string }) {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className={className}>
        <LogOut aria-hidden className="size-4" /> Sign out
      </button>
    </form>
  );
}

export function AdminShell({ openCount, children }: { openCount: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const isCurrent = (href: string) => (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-dvh bg-mist">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-night p-4 text-white lg:flex">
        <Link href="/admin" aria-label="Semsorted dashboard" className="rounded-xl bg-white px-3 py-2.5">
          <Logo />
        </Link>
        <nav aria-label="Admin" className="mt-6 flex-1 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const current = isCurrent(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn("flex min-h-12 items-center gap-3 rounded-xl px-2.5 font-semibold transition-colors", current ? "bg-white text-night" : "text-white/80 hover:bg-white/10 hover:text-white")}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", item.tint)}>
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/attention" && openCount > 0 && (
                  <span aria-label={`${openCount} open`} className="min-w-6 rounded-full bg-g-red px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-white">{openCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <Link href="/admin/shops/new" className="mb-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-g-blue font-semibold text-white hover:bg-pine-deep">
          <Plus aria-hidden className="size-4" /> Add business
        </Link>
        <SignOut className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white" />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
        <Link href="/admin" aria-label="Semsorted dashboard"><Logo /></Link>
        <div className="flex items-center gap-1">
          <Link href="/admin/shops/new" aria-label="Add business" className="flex size-11 items-center justify-center rounded-full bg-g-blue text-white"><Plus aria-hidden className="size-5" /></Link>
          <SignOut className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-moss" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:max-w-none lg:px-8 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const current = isCurrent(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className={cn("relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold", current ? "text-ink" : "text-moss")}>
              <span className={cn("flex size-7 items-center justify-center rounded-lg", current ? item.tint : "bg-mist")}>
                <Icon aria-hidden className="size-4" />
              </span>
              {item.short}
              {item.href === "/admin/attention" && openCount > 0 && (
                <span aria-label={`${openCount} open`} className="absolute right-[calc(50%-1.5rem)] top-1.5 min-w-5 rounded-full bg-g-red px-1 text-center text-[0.68rem] font-bold leading-5 text-white">{openCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
