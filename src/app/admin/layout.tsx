import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

function SignOut() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="min-h-11 rounded-full px-3 text-sm font-semibold text-moss hover:bg-ink/5 hover:text-ink">
        Sign out
      </button>
    </form>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch((error: unknown) => {
    if (error instanceof AuthError && error.status === 403) return "no-access" as const;
    throw error;
  });
  if (!user) redirect("/login");

  if (user === "no-access" || user.role !== "SUPER_ADMIN") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[30rem] flex-col items-start justify-center px-5">
        <h1 className="text-[2.35rem] font-bold">This account is not an admin</h1>
        <p className="mb-4 mt-3 text-moss">Sign out and use the admin account.</p>
        <SignOut />
      </main>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/admin" className="font-display text-xl font-bold tracking-tight">
            Review QR
          </Link>
          <SignOut />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
