import { cn } from "@/lib/utils";

const BLUE = "#1a73e8";
const RED = "#ea4335";
const YELLOW = "#f9ab00";
const GREEN = "#34a853";

export const WORDMARK = [
  ["S", BLUE],
  ["e", RED],
  ["m", YELLOW],
  ["s", BLUE],
  ["o", GREEN],
  ["r", RED],
  ["t", YELLOW],
  ["e", BLUE],
  ["d", GREEN],
] as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="-2 -2 52 52" className={className}>
      <g fill="none" strokeWidth="8.5">
        <path stroke="#1a73e8" d="M34 14A10 10 0 1 0 24 24" />
        <path stroke="#34a853" d="M24 24A10 10 0 1 1 14 34" />
      </g>
      <circle cx="34" cy="14" r="4.25" fill="#ea4335" />
      <polygon fill="#fbbc04" points="14,27.4 15.78,31.54 20.28,31.96 16.89,34.94 17.88,39.34 14,37.04 10.12,39.34 11.11,34.94 7.72,31.96 12.22,31.54" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-display text-[1.5rem] font-semibold leading-none tracking-[-0.02em]", className)}>
      <LogoMark className="size-8 shrink-0" />
      <span className="translate-y-[0.14em]">
        {WORDMARK.map(([letter, color], index) => (
          <span key={index} style={{ color }}>{letter}</span>
        ))}
      </span>
    </span>
  );
}
