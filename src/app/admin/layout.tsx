import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { openAttentionCount } from "@/lib/admin/attention";
import { AuthError, getCurrentUser } from "@/lib/auth/session";
import { AdminShell } from "./_components/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

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
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="min-h-11 rounded-full px-3 text-sm font-semibold text-moss hover:bg-ink/5 hover:text-ink">
            Sign out
          </button>
        </form>
      </main>
    );
  }

  return <AdminShell openCount={await openAttentionCount()}>{children}</AdminShell>;
}
