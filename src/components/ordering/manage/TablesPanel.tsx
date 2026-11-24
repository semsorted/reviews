"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton } from "@/app/admin/_components/ConfirmButton";
import { adminRequest } from "@/app/admin/_components/request";
import { Panel } from "@/app/admin/_components/TrackingBlocks";
import { CopyButton, NoteLine, Switch, type Note } from "./CopyButton";

type Table = { id: string; label: string; isActive: boolean; url: string };

export function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer aria-hidden className="size-4" /> Print
    </Button>
  );
}

export function TablesPanel({ apiBase, printHref, tables }: { apiBase: string; printHref: string; tables: Table[] }) {
  const router = useRouter();
  const [count, setCount] = useState("4");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const base = `${apiBase}/tables`;

  const send = async (url: string, method: string, body: object, done = "") => {
    setNote(null);
    const result = await adminRequest(url, method, body);
    setNote(result.ok ? (done ? { ok: true, text: done } : null) : { ok: false, text: result.error });
    router.refresh();
    return result.ok;
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    await send(base, "POST", { count: Number(count) }, "Tables added.");
    setBusy(false);
  };

  const rename = (id: string) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(`${base}/${id}`, "PATCH", { label: String(new FormData(event.currentTarget).get("label") ?? "") }, "Table name saved.");
  };

  return (
    <Panel
      title="Tables"
      action={tables.some((table) => table.isActive) && (
        <Link href={printHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Printer aria-hidden className="size-4" /> Print table QR cards
        </Link>
      )}
    >
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Label htmlFor="table-count">Tables to add</Label>
          <Input id="table-count" type="number" required min={1} max={50} inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value)} />
        </div>
        <Button type="submit" isLoading={busy}>Add tables</Button>
      </form>
      <p className="mt-2 text-sm text-moss">New tables are named T1, T2 and so on. Rename them below if you like.</p>
      <div className="mt-3"><NoteLine note={note} /></div>

      {tables.length ? (
        <ul className="mt-5 divide-y divide-line">
          {tables.map((table) => (
            <li key={table.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <form onSubmit={rename(table.id)} className="flex min-w-56 flex-1 items-center gap-2">
                <label htmlFor={`table-${table.id}`} className="sr-only">Name of table {table.label}</label>
                <Input id={`table-${table.id}`} name="label" key={table.label} defaultValue={table.label} required maxLength={20} className="w-28 font-semibold" />
                <Button type="submit" variant="ghost" size="sm">Save</Button>
              </form>
              <Switch checked={table.isActive} name={table.label} label={table.isActive ? "Active" : "Paused"} onChange={(isActive) => send(`${base}/${table.id}`, "PATCH", { isActive })} />
              <CopyButton text={table.url} label={`Copy guest link for ${table.label}`} />
              <ConfirmButton
                variant="ghost"
                size="sm"
                title={`New QR for ${table.label}?`}
                message="The old printed QR for this table stops working at once. Print and place the new card."
                confirmLabel="Make new QR"
                onConfirm={async () => void (await send(`${base}/${table.id}`, "PATCH", { newQr: true }, `New QR made for ${table.label}. Print its card again.`))}
              >
                New QR
              </ConfirmButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-mist p-4 text-sm text-moss">No tables yet. Add as many as the restaurant has.</p>
      )}
    </Panel>
  );
}
