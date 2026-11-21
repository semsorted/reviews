"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Link2, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./ConfirmButton";
import { adminRequest } from "./request";

interface Qr {
  id: string;
  name: string;
  url: string;
  scanCount: number;
  isActive: boolean;
}

export function QrManager({ shopId, qrCodes }: { shopId: string; qrCodes: Qr[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const base = `/api/admin/shops/${shopId}/qr-codes`;

  const run = async (url: string, method: string, body?: unknown) => {
    setIsBusy(true);
    setError(null);
    const result = await adminRequest(url, method, body);
    setIsBusy(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (await run(base, "POST", { name })) setName("");
  };

  const copyLink = async (qr: Qr) => {
    try {
      await navigator.clipboard.writeText(qr.url);
      setCopiedId(qr.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError(`Copy this link manually: ${qr.url}`);
    }
  };

  return (
    <section aria-labelledby="qr-title">
      <h2 id="qr-title" className="text-2xl font-semibold">
        QR codes
      </h2>

      <form onSubmit={create} className="mt-3 flex gap-2">
        <Input
          aria-label="QR code name"
          required
          minLength={2}
          maxLength={60}
          placeholder="Counter, Table 4, Entrance"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" isLoading={isBusy} className="shrink-0">
          Generate QR
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-3 break-words text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {qrCodes.map((qr) => (
          <li key={qr.id} className="flex flex-col gap-4 rounded-xl bg-paper p-4 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${base}/${qr.id}/download?format=png`}
              alt={`QR code for ${qr.name}`}
              width={136}
              height={136}
              className={cn("size-34 shrink-0 self-start rounded-lg border border-line", !qr.isActive && "opacity-35")}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">{qr.name}</h3>
                <span className={cn("shrink-0 text-sm font-semibold", qr.isActive ? "text-pine" : "text-moss")}>
                  {qr.isActive ? "Live" : "Paused"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-moss">
                {qr.scanCount} {qr.scanCount === 1 ? "scan" : "scans"}
              </p>
              <p className="mt-1 truncate text-sm text-moss">{qr.url}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <a href={`${base}/${qr.id}/download?format=png`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Download aria-hidden className="size-4" /> PNG
                </a>
                <a href={`${base}/${qr.id}/download?format=svg`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Download aria-hidden className="size-4" /> SVG
                </a>
                <Button type="button" variant="outline" size="sm" onClick={() => copyLink(qr)}>
                  {copiedId === qr.id ? <Check aria-hidden className="size-4" /> : <Link2 aria-hidden className="size-4" />}
                  {copiedId === qr.id ? "Copied" : "Copy link"}
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={isBusy} onClick={() => run(`${base}/${qr.id}`, "PATCH", { isActive: !qr.isActive })}>
                  {qr.isActive ? "Pause" : "Activate"}
                </Button>
                <ConfirmButton
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${qr.name}`}
                  className="text-moss"
                  title={`Delete “${qr.name}”?`}
                  message="Any printed copy of this QR code will stop working. This cannot be undone."
                  confirmLabel="Delete QR code"
                  onConfirm={async () => {
                    await run(`${base}/${qr.id}`, "DELETE");
                  }}
                >
                  <Trash2 aria-hidden className="size-4" />
                </ConfirmButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {qrCodes.length === 0 && <p className="mt-4 text-moss">Name your first QR code above to generate it.</p>}
    </section>
  );
}
