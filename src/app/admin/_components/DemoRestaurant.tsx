"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminRequest } from "./request";

type Created = { shopId: string; logins: { role: string; name: string; login: string; password: string }[] };

/** One tap adds a sample restaurant to show an owner how it works. */
export function DemoRestaurant({ exists }: { exists: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    const result = await adminRequest<Created>("/api/admin/restaurants/demo", "POST");
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setCreated(result.data);
    router.refresh();
  };

  if (created) {
    return (
      <section aria-label="Sample restaurant logins" className="rounded-2xl bg-g-green-tint p-5">
        <h2 className="text-lg font-semibold">Sample restaurant is ready</h2>
        <p className="text-sm text-moss">Save these logins now. The passwords are not shown again. Log in at /restaurant/login.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {created.logins.map((person) => (
            <li key={person.login} className="rounded-xl bg-paper p-3 text-sm">
              <p className="font-semibold">{person.name}</p>
              <p className="select-all break-all">{person.login}</p>
              <p className="select-all break-all font-mono">{person.password}</p>
            </li>
          ))}
        </ul>
        <Link href={`/admin/restaurants/${created.shopId}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-pine hover:underline">Open the sample restaurant</Link>
      </section>
    );
  }
  if (exists) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-4">
      <Sparkles aria-hidden className="size-5 shrink-0 text-pine" />
      <p className="min-w-0 flex-1 text-sm text-moss">Showing this to an owner? Add a sample restaurant with a menu, tables, staff logins and a few orders.</p>
      <Button type="button" variant="outline" onClick={create} disabled={busy}>{busy ? "Adding" : "Add sample restaurant"}</Button>
      {error && <p role="alert" className="w-full text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
