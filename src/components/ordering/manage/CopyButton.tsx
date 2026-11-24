"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Small client controls shared by the ordering screens. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [note, setNote] = useState<"copied" | "failed" | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNote("copied");
    } catch {
      setNote("failed");
    }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={label === "Copy" ? undefined : label}>
        {note === "copied" ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />} Copy
      </Button>
      <span role="status" className={cn("text-sm font-medium", note === "failed" ? "text-danger" : "text-g-green")}>
        {note === "copied" ? "Copied." : note === "failed" ? "Copy did not work. Select the link and copy it." : ""}
      </span>
    </span>
  );
}

export function Switch({ checked, onChange, label, name, busy }: { checked: boolean; onChange: (next: boolean) => void; label: string; name?: string; busy?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={name ? `${name}: ${label}` : undefined}
      disabled={busy}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-1.5 text-sm font-semibold disabled:opacity-60"
    >
      <span aria-hidden className={cn("relative h-6 w-10 rounded-full transition-colors", checked ? "bg-g-green" : "bg-moss")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", checked ? "left-[1.125rem]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

export type Note = { ok: boolean; text: string } | null;

export function NoteLine({ note }: { note: Note }) {
  if (!note) return null;
  return <p role={note.ok ? "status" : "alert"} className={cn("text-sm font-medium", note.ok ? "text-g-green" : "text-danger")}>{note.text}</p>;
}

/** A password box with a Show button, for owners setting a password they will tell someone. */
export function PasswordInput(props: InputProps & { id: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex gap-2">
      <Input type={shown ? "text" : "password"} minLength={8} maxLength={72} autoComplete="new-password" spellCheck={false} {...props} />
      <Button type="button" variant="outline" className="shrink-0" aria-controls={props.id} aria-pressed={shown} onClick={() => setShown(!shown)}>
        {shown ? "Hide" : "Show"}
      </Button>
    </div>
  );
}
