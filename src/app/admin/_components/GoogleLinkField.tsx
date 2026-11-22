"use client";

import { Check, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAllowedGoogleReviewUrl } from "@/lib/reviews/rules";

export type LinkCheck = "idle" | "opened" | "correct";

export function GoogleLinkField({ value, name, check, onChange, onCheck }: { value: string; name: string; check: LinkCheck; onChange: (url: string) => void; onCheck: (check: LinkCheck) => void }) {
  const url = value.trim();
  const isValid = isAllowedGoogleReviewUrl(url);

  return (
    <div>
      <Label htmlFor="google">Google review link</Label>
      <div className="flex gap-2">
        <Input id="google" type="url" required placeholder="https://g.page/r/your-business/review" value={value} onChange={(event) => onChange(event.target.value)} />
        {isValid ? (
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => onCheck("opened")} className={buttonVariants({ variant: "outline", className: "shrink-0" })}>
            <ExternalLink aria-hidden className="size-4" /> Test link
          </a>
        ) : (
          <Button type="button" variant="outline" disabled className="shrink-0"><ExternalLink aria-hidden className="size-4" /> Test link</Button>
        )}
      </div>
      {url && !isValid ? (
        <p role="alert" className="mt-1 text-sm font-medium text-danger">Paste a secure Google link. It usually starts with https://g.page/r/</p>
      ) : (
        <p className="mt-1 text-sm text-moss">Find it in Google Business Profile under “Ask for reviews”.</p>
      )}
      {check === "opened" && (
        <div className="mt-2 rounded-xl bg-g-yellow-tint p-3">
          <p className="font-semibold">Did Google open the review box for {name.trim() || "this business"}?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => onCheck("correct")}><Check aria-hidden className="size-4" /> Yes, it is correct</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { onChange(""); onCheck("idle"); document.getElementById("google")?.focus(); }}>No, change link</Button>
          </div>
        </div>
      )}
      {check === "correct" && (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-g-green"><Check aria-hidden className="size-4" /> Link checked</p>
      )}
    </div>
  );
}
