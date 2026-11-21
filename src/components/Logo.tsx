import { cn } from "@/lib/utils";

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
    <span className={cn("inline-flex items-center gap-1.5 font-display text-[1.45rem] font-semibold leading-none tracking-[-0.025em]", className)}>
      <LogoMark className="size-8 shrink-0" />
      <span className="translate-y-[0.14em]">Semsorted</span>
    </span>
  );
}
