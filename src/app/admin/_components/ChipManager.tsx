"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chipsForShopType } from "@/lib/reviews/catalog";
import { MAX_ACTIVE_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./ConfirmButton";
import { adminRequest } from "./request";

interface Chip {
  id: string;
  label: string;
  isActive: boolean;
}

const iconButton = "flex size-11 items-center justify-center rounded-full text-moss hover:bg-ink/5 hover:text-ink disabled:opacity-30";

export function ChipManager({ shopId, shopType, chips }: { shopId: string; shopType: string; chips: Chip[] }) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/admin/shops/${shopId}/chips`;
  const activeCount = chips.filter((chip) => chip.isActive).length;
  const existing = new Set(chips.map((chip) => chip.label.toLowerCase()));
  const suggestions = chips.length < MAX_ACTIVE_CHIPS ? chipsForShopType(shopType).filter((label) => !existing.has(label.toLowerCase())) : [];

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

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (newLabel.trim() && (await run(base, "POST", { label: newLabel }))) setNewLabel("");
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (editing && (await run(`${base}/${editing.id}`, "PATCH", { label: editing.label }))) setEditing(null);
  };

  const move = (index: number, offset: number) => {
    const ordered = chips.map((chip) => chip.id);
    [ordered[index], ordered[index + offset]] = [ordered[index + offset], ordered[index]];
    return run(base, "PATCH", { orderedIds: ordered });
  };

  return (
    <section aria-labelledby="chips-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="chips-title" className="text-2xl font-semibold">
          Chips
        </h2>
        <p className="text-sm text-moss">{activeCount} live</p>
      </div>
      <p className="mt-1 text-sm text-moss">
        Customers tap 2 to 4 of these. Keep at least {MIN_CHIPS} live.
      </p>

      <ul className="mt-4 divide-y divide-line rounded-xl bg-paper">
        {chips.map((chip, index) => (
          <li key={chip.id} className="flex flex-wrap items-center gap-x-1 px-3 py-1.5">
            {editing?.id === chip.id ? (
              <form onSubmit={saveEdit} className="flex min-w-0 flex-1 items-center gap-1">
                <Input
                  aria-label={`Rename ${chip.label}`}
                  autoFocus
                  maxLength={40}
                  value={editing.label}
                  onChange={(event) => setEditing({ id: chip.id, label: event.target.value })}
                />
                <button type="submit" aria-label="Save name" disabled={isBusy} className={iconButton}>
                  <Check aria-hidden className="size-5" />
                </button>
                <button type="button" aria-label="Cancel rename" onClick={() => setEditing(null)} className={iconButton}>
                  <X aria-hidden className="size-5" />
                </button>
              </form>
            ) : (
              <>
                <span className={cn("min-w-32 flex-1 font-medium", !chip.isActive && "text-moss line-through")}>{chip.label}</span>
                <button type="button" aria-label={`Move ${chip.label} up`} disabled={isBusy || index === 0} onClick={() => move(index, -1)} className={iconButton}>
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button type="button" aria-label={`Move ${chip.label} down`} disabled={isBusy || index === chips.length - 1} onClick={() => move(index, 1)} className={iconButton}>
                  <ArrowDown aria-hidden className="size-4" />
                </button>
                <button type="button" aria-label={`Rename ${chip.label}`} onClick={() => setEditing({ id: chip.id, label: chip.label })} className={iconButton}>
                  <Pencil aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={chip.isActive}
                  aria-label={`${chip.label} shown to customers`}
                  disabled={isBusy}
                  onClick={() => run(`${base}/${chip.id}`, "PATCH", { isActive: !chip.isActive })}
                  className="flex h-11 items-center px-1.5 disabled:opacity-50"
                >
                  <span className={cn("flex h-6 w-10 rounded-full p-0.5 transition-colors", chip.isActive ? "justify-end bg-pine" : "justify-start bg-line")}>
                    <span className="size-5 rounded-full bg-paper" />
                  </span>
                </button>
                <ConfirmButton
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${chip.label}`}
                  className="text-moss"
                  title={`Delete “${chip.label}”?`}
                  message="Customers will stop seeing this chip."
                  confirmLabel="Delete chip"
                  onConfirm={async () => {
                    await run(`${base}/${chip.id}`, "DELETE");
                  }}
                >
                  <Trash2 aria-hidden className="size-4" />
                </ConfirmButton>
              </>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-moss">Suggested for {shopType}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                disabled={isBusy}
                onClick={() => run(base, "POST", { label })}
                className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-moss/50 bg-paper px-3.5 text-sm font-medium hover:border-pine disabled:opacity-50"
              >
                <Plus aria-hidden className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={add} className="mt-3 flex gap-2">
        <Input
          aria-label="New chip"
          maxLength={40}
          placeholder="Add a chip"
          value={newLabel}
          disabled={chips.length >= MAX_ACTIVE_CHIPS}
          onChange={(event) => setNewLabel(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={isBusy || !newLabel.trim() || chips.length >= MAX_ACTIVE_CHIPS}>
          Add
        </Button>
      </form>
    </section>
  );
}
