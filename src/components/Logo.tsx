import { cn } from "@/lib/utils";

const BLUE = "#4285f4";
const RED = "#ea4335";
const YELLOW = "#fbbc05";
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
        <path stroke={RED} d="M34 14A10 10 0 0 0 14 14" />
        <path stroke={YELLOW} d="M14 14A10 10 0 0 0 24 24" />
        <path stroke={GREEN} d="M24 24A10 10 0 0 1 34 34" />
        <path stroke={BLUE} d="M34 34A10 10 0 0 1 14 34" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-logo text-[1.5rem] font-medium leading-none tracking-normal", className)}>
      <LogoMark className="size-[1.33em] shrink-0" />
      <span>
        {WORDMARK.map(([letter, color], index) => (
          <span key={index} style={{ color }}>{letter}</span>
        ))}
      </span>
    </span>
  );
}
