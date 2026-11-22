"use client";

import { useState } from "react";
import { estimateReviews } from "@/app/_landing/estimate";

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4 text-lg">
        {label}
        <output className="font-display text-3xl font-semibold text-g-blue">{value}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 h-11 w-full accent-g-blue" />
    </label>
  );
}

export function ReviewMath() {
  const [customers, setCustomers] = useState(40);
  const [perHundred, setPerHundred] = useState(3);

  return (
    <div className="grid overflow-hidden rounded-[1.75rem] border border-line lg:grid-cols-2">
      <div className="space-y-8 p-7 lg:p-10">
        <Slider label="Roz kitne customers aate hain?" value={customers} min={10} max={300} step={5} onChange={setCustomers} />
        <Slider label="100 me se kitne review denge?" value={perHundred} min={1} max={10} step={1} onChange={setPerHundred} />
        <p className="text-sm leading-relaxed text-moss">Yeh sirf andaza hai, guarantee nahi. Hisaab mahine ke 26 din par hai, aur review dena customer ki apni marzi hai.</p>
      </div>
      <div aria-live="polite" className="flex flex-col justify-between gap-8 bg-g-blue p-7 text-white lg:p-10">
        <div>
          <p className="text-lg">Ek saal me lagbhag</p>
          <p className="mt-1 font-display text-[clamp(4.5rem,10vw,8rem)] font-semibold leading-none tracking-[-0.04em]">{estimateReviews(customers, perHundred, 12).toLocaleString("en-IN")}</p>
          <p className="text-lg">naye reviews</p>
        </div>
        <dl className="flex gap-10">
          {[1, 3, 6].map((months) => (
            <div key={months}>
              <dd className="font-display text-3xl font-semibold">{estimateReviews(customers, perHundred, months).toLocaleString("en-IN")}</dd>
              <dt className="text-white/80">{months} {months === 1 ? "mahina" : "mahine"}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
