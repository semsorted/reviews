import { cn } from "@/lib/utils";

const NAVY = "#0b2447";
const BLUE = "#1a56db";
const GREEN = "#12a150";
const RED = "#e5484d";
const GOLD = "#f5b301";

export const WORDMARK = [
  ["Sem", NAVY],
  ["sorted", BLUE],
] as const;

export const LOGO_STAR = "38.5,30.5 40.71,35 45.66,35.72 42.08,39.21 42.92,44.14 38.5,41.82 34.08,44.14 34.92,39.21 31.34,35.72 36.29,35";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      <rect x="14" y="5" width="30" height="10" rx="5" fill={BLUE} />
      <rect x="4" y="19" width="40" height="10" rx="5" fill={GREEN} />
      <rect x="4" y="33" width="24" height="10" rx="5" fill={RED} />
      <polygon fill={GOLD} points={LOGO_STAR} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-logo text-[1.5rem] font-semibold leading-none tracking-[-0.02em]", className)}>
      <LogoMark className="size-[1.25em] shrink-0" />
      <span>
        {WORDMARK.map(([part, color]) => (
          <span key={part} style={{ color }}>{part}</span>
        ))}
      </span>
    </span>
  );
}
