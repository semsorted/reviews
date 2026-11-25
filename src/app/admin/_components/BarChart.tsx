"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { niceMax } from "@/lib/admin/tracking-core";

export type BarPoint = { label: string; values: Record<string, number> };
export type BarSeries = { key: string; name: string; color: string };

const total = (point: BarPoint, series: BarSeries[]) => series.reduce((sum, item) => sum + (point.values[item.key] ?? 0), 0);

/** Daily or monthly bars. More than one series stack, with a 2px gap and a rounded top. Hover, arrow keys and a table view all show the same numbers. */
export function BarChart({
  title,
  points,
  series,
  prefix = "",
  ariaLabel,
  emptyText,
}: {
  title: string;
  points: BarPoint[];
  series: BarSeries[];
  /** Put before every number, for example "₹". A function cannot be passed from a server page. */
  prefix?: string;
  ariaLabel: string;
  emptyText: string;
}) {
  const format = (value: number) => `${prefix}${value.toLocaleString("en-IN")}`;
  const plot = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const last = points.length - 1;
  const max = niceMax(Math.max(1, ...points.map((point) => total(point, series))));
  const hasData = points.some((point) => total(point, series) > 0);
  const many = points.length > 12;

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = plot.current?.getBoundingClientRect();
    if (!box) return;
    setActive(Math.max(0, Math.min(last, Math.floor(((event.clientX - box.left) / box.width) * points.length))));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") setActive((value) => Math.max(0, (value ?? points.length) - 1));
    if (event.key === "ArrowRight") setActive((value) => Math.min(last, (value ?? -1) + 1));
    if (event.key === "Escape") setActive(null);
  };
  const shown = active === null ? null : points[active];

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
        <span className="text-lg font-semibold">{title}</span>
        {series.length > 1 && (
          <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-moss">
            {series.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
            ))}
          </span>
        )}
      </figcaption>

      {hasData ? (
        <div className="relative mt-4 h-60 pb-6 pl-11">
          {[0, 0.5, 1].map((tick) => (
            <span key={tick} aria-hidden className="absolute left-0 w-9 -translate-y-1/2 text-right text-xs tabular-nums text-moss" style={{ top: `calc((100% - 1.5rem) * ${1 - tick})` }}>
              {max * tick === 0 || Number.isInteger(max * tick) ? format(max * tick) : ""}
            </span>
          ))}
          <div
            ref={plot}
            role="img"
            tabIndex={0}
            aria-label={`${ariaLabel} Use left and right arrow keys to read each bar.`}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            className="relative h-full touch-pan-y rounded-sm"
          >
            {[0, 50, 100].map((line) => (
              <span key={line} aria-hidden className="pointer-events-none absolute inset-x-0 h-px bg-line" style={{ top: `${line}%`, opacity: line === 100 ? 1 : 0.55 }} />
            ))}
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
              {points.map((point, index) => {
                const top = [...series].reverse().find((item) => (point.values[item.key] ?? 0) > 0)?.key;
                return (
                  <div key={point.label} className={`flex h-full flex-col-reverse items-center px-px ${active === index ? "bg-mist" : ""}`}>
                    <div className={`flex h-full w-full flex-col-reverse justify-start gap-0.5 ${many ? "" : "max-w-12"}`}>
                      {series.map((item) => {
                        const value = point.values[item.key] ?? 0;
                        if (!value) return null;
                        return (
                          <span
                            key={item.key}
                            className={`block w-full shrink-0 ${item.key === top ? "rounded-t-[4px]" : ""}`}
                            style={{ height: `max(2px, ${(value / max) * 100}%)`, backgroundColor: item.color }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {shown && active !== null && (
              <div
                role="status"
                className="pointer-events-none absolute top-1 z-10 w-44 rounded-lg bg-ink px-3 py-2 text-sm text-white shadow-lg"
                style={{ left: `${((active + 0.5) / points.length) * 100}%`, transform: active / points.length > 0.55 ? "translateX(calc(-100% - 0.75rem))" : "translateX(0.75rem)" }}
              >
                <p className="font-semibold">{shown.label}</p>
                {series.map((item) => (
                  <p key={item.key} className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="size-2 rounded-sm ring-1 ring-white/60" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="tabular-nums">{format(shown.values[item.key] ?? 0)}</span>
                  </p>
                ))}
                {series.length > 1 && (
                  <p className="mt-1 flex justify-between gap-3 border-t border-white/25 pt-1 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{format(total(shown, series))}</span>
                  </p>
                )}
              </div>
            )}
          </div>
          <div aria-hidden className="absolute bottom-0 left-11 right-0 flex justify-between text-xs text-moss">
            {many ? (
              <>
                <span>{points[0].label}</span>
                <span>{points[Math.floor(last / 2)].label}</span>
                <span>{points[last].label}</span>
              </>
            ) : (
              points.map((point) => <span key={point.label} className="flex-1 text-center">{point.label}</span>)
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-mist px-4 py-10 text-center text-moss">{emptyText}</p>
      )}

      {hasData && (
        <details className="mt-3 text-sm">
          <summary className="inline-flex min-h-9 cursor-pointer items-center font-medium text-moss hover:text-ink">View as table</summary>
          <div className="max-h-56 overflow-auto">
            <table className="w-full text-left tabular-nums">
              <thead className="sticky top-0 bg-paper text-moss">
                <tr>
                  <th className="py-1.5 font-medium">Day</th>
                  {series.map((item) => <th key={item.key} className="py-1.5 text-right font-medium">{item.name}</th>)}
                  {series.length > 1 && <th className="py-1.5 text-right font-medium">Total</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...points].reverse().map((point) => (
                  <tr key={point.label}>
                    <td className="py-1.5">{point.label}</td>
                    {series.map((item) => <td key={item.key} className="py-1.5 text-right">{format(point.values[item.key] ?? 0)}</td>)}
                    {series.length > 1 && <td className="py-1.5 text-right font-medium">{format(total(point, series))}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}
