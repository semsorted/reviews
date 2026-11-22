"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import type { SubscriptionInfo } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./ConfirmButton";
import { adminRequest } from "./request";

const TONE = {
  active: "bg-g-green-tint text-g-green",
  ending: "bg-g-yellow-tint text-ink",
  expired: "bg-g-red-tint text-g-red",
};

export function SubscriptionPanel({ shopId, info, renewedOn }: { shopId: string; info: SubscriptionInfo; renewedOn: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const renew = async () => {
    setError(null);
    const result = await adminRequest(`/api/admin/shops/${shopId}/subscription`, "POST", { expectedEndsAt: info.endsAt });
    if (!result.ok) setError(result.error);
    router.refresh();
  };

  return (
    <section aria-label="Subscription" className="rounded-2xl bg-paper p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONE[info.state])}>
          <CalendarClock aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold leading-tight">{info.label}</p>
          <p className="text-sm text-moss">
            {info.state === "expired" ? `Ended ${info.endsOn}. Its QR is stopped.` : `Subscription ends ${info.endsOn}`}
          </p>
        </div>
        <ConfirmButton
          variant={info.state === "active" ? "outline" : "default"}
          confirmVariant="default"
          title="Renew for 1 year?"
          message={`The new end date will be ${renewedOn}.${info.state === "expired" ? " Its QR starts working again right away." : ""}`}
          confirmLabel="Renew 1 year"
          onConfirm={renew}
        >
          Renew 1 year
        </ConfirmButton>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}
    </section>
  );
}
