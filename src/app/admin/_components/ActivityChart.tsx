"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { niceMax } from "@/lib/admin/tracking-core";
import type { DayPoint } from "@/lib/admin/tracking";

const SERIES = [
  { key: "scans", name: "Scans", color: "#1a73e8" },
  { key: "google", name: "Sent to Google", color: "#188038" },
] as const;

export function ActivityChart({ points }: { points: DayPoint[] }) {
  const plot = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...points.flatMap((point) => [point.scans, point.google])));
  const last = points.length - 1;
  const x = (index: number) => (last ? (index / last) * 100 : 50);
  const y = (value: number) => 100 - (value / max) * 100;
  const hasData = points.some((point) => point.scans || point.google);

  const labelTops = SERIES.map((series) => y(points[last][series.key]));
  if (Math.abs(labelTops[0] - labelTops[1]) < 12) {
    const middle = (labelTops[0] + labelTops[1]) / 2;
    const scansHigher = labelTops[0] <= labelTops[1];
    labelTops[0] = middle + (scansHigher ? -6 : 6);
    labelTops[1] = middle + (scansHigher ? 6 : -6);
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = plot.current?.getBoundingClientRect();
    if (!box) return;
    setActive(Math.max(0, Math.min(last, Math.round(((event.clientX - box.left) / box.width) * last))));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") setActive((value) => Math.max(0, (value ?? last) - 1));
    if (event.key === "ArrowRight") setActive((value) => Math.min(last, (value ?? -1) + 1));
    if (event.key === "Escape") setActive(null);
  };
  const shown = active === null ? null : points[active];

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
        <span className="text-lg font-semibold">Last {points.length} days</span>
        <span className="flex flex-wrap gap-x-4 text-sm text-moss">
          {SERIES.map((series) => (
            <span key={series.key} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ backgroundColor: series.color }} />
              {series.name}
            </span>
          ))}
        </span>
      </figcaption>

      {hasData ? (
        <div className="relative mt-4 h-72 pb-6 pl-8 pr-[6.5rem]">
          {[0, 0.5, 1].map((tick) => (
            <span key={tick} aria-hidden className="absolute left-0 w-6 -translate-y-1/2 text-right text-xs tabular-nums text-moss" style={{ top: `calc((100% - 1.5rem) * ${1 - tick})` }}>
              {Number.isInteger(max * tick) ? max * tick : ""}
            </span>
          ))}
          <div
            ref={plot}
            role="img"
            tabIndex={0}
            aria-label={`Daily scans and customers sent to Google for the last ${points.length} days. Use left and right arrow keys to read each day.`}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            className="relative h-full touch-pan-y rounded-sm"
          >
            <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              {[0, 50, 100].map((line) => (
                <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity={line === 100 ? 1 : 0.55} />
              ))}
              {SERIES.map((series) => (
                <polyline
                  key={series.key}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={points.map((point, index) => `${x(index)},${y(point[series.key])}`).join(" ")}
                />
              ))}
            </svg>

            {SERIES.map((series, index) => (
              <span key={series.key} aria-hidden className="absolute left-full ml-2 w-24 -translate-y-1/2 truncate text-xs font-medium text-ink" style={{ top: `${labelTops[index]}%` }}>
                {series.name}
              </span>
            ))}

            {shown && active !== null && (
              <>
                <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-moss/50" style={{ left: `${x(active)}%` }} />
                {SERIES.map((series) => (
                  <span
                    key={series.key}
                    aria-hidden
                    className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper"
                    style={{ left: `${x(active)}%`, top: `${y(shown[series.key])}%`, backgroundColor: series.color }}
                  />
                ))}
                <div
                  role="status"
                  className={`pointer-events-none absolute top-1 z-10 w-40 rounded-lg bg-ink px-3 py-2 text-sm text-white shadow-lg ${x(active) > 55 ? "-translate-x-[calc(100%+0.625rem)]" : "translate-x-2.5"}`}
                  style={{ left: `${x(active)}%` }}
                >
                  <p className="font-semibold">{shown.label}</p>
                  {SERIES.map((series) => (
                    <p key={series.key} className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="size-2 rounded-full ring-1 ring-white/60" style={{ backgroundColor: series.color }} />
                        {series.name === "Sent to Google" ? "Google" : series.name}
                      </span>
                      <span className="tabular-nums">{shown[series.key]}</span>
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
          <div aria-hidden className="absolute bottom-0 left-8 right-[6.5rem] flex justify-between text-xs text-moss">
            <span>{points[0].label}</span>
            <span>{points[Math.floor(last / 2)].label}</span>
            <span>{points[last].label}</span>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-mist px-4 py-10 text-center text-moss">No scans in this period yet.</p>
      )}

      {hasData && (
        <details className="mt-3 text-sm">
          <summary className="inline-flex min-h-9 cursor-pointer items-center font-medium text-moss hover:text-ink">View as table</summary>
          <div className="max-h-56 overflow-auto">
            <table className="w-full text-left tabular-nums">
              <thead className="sticky top-0 bg-paper text-moss">
                <tr><th className="py-1.5 font-medium">Day</th><th className="py-1.5 text-right font-medium">Scans</th><th className="py-1.5 text-right font-medium">Sent to Google</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...points].reverse().map((point) => (
                  <tr key={point.day}><td className="py-1.5">{point.label}</td><td className="py-1.5 text-right">{point.scans}</td><td className="py-1.5 text-right">{point.google}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}
