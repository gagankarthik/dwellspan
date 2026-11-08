"use client";

import { useState, type ReactNode } from "react";
import { compactMoney, money } from "./ui";

/** Diagonal texture for "scheduled", so it never relies on colour alone. */
const HATCH = "repeating-linear-gradient(135deg, var(--color-brand) 0 2px, var(--color-brand-soft) 2px 6px)";

export function LegendDot({ fill, label }: { fill: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 caption-4 text-ink-2">
      <span aria-hidden className="size-3 rounded-[3px]" style={{ background: fill }} />
      {label}
    </span>
  );
}
export const SWATCH = { paid: "var(--color-brand)", scheduled: HATCH, lease: "var(--color-amber)", expense: "var(--color-ink-3)" };

/** Rounds the axis top up to a clean step. */
function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export type MonthBar = { key: string; label: string; paid: number; scheduled: number; current?: boolean };

/** Monthly income: collected (solid) stacked under scheduled (hatched). One axis, hover for exact numbers. */
export function IncomeChart({ data, height = 200 }: { data: MonthBar[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.paid + d.scheduled), 0));
  const ticks = [max, max / 2, 0];
  const h = hover !== null ? data[hover] : null;
  return (
    <figure>
      <div className="flex flex-wrap gap-4">
        <LegendDot fill={SWATCH.paid} label="Collected" />
        <LegendDot fill={SWATCH.scheduled} label="Scheduled" />
      </div>
      <div className="relative mt-4 flex gap-2">
        <div className="flex flex-col justify-between pb-6 text-right caption-5 text-ink-3" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {compactMoney(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }} aria-hidden>
            {ticks.map((t) => (
              <span key={t} className={`h-px ${t === 0 ? "bg-ink-3/50" : "bg-line/70"}`} />
            ))}
          </div>
          <ul className="relative flex items-end gap-[2px] sm:gap-1" style={{ height }} onPointerLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const total = d.paid + d.scheduled;
              const tall = (v: number) => `${(v / max) * (height - 24)}px`;
              return (
                <li key={d.key} className="flex h-full flex-1 flex-col items-center justify-end">
                  <button
                    type="button"
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    aria-label={`${d.label}: ${money(d.paid)} collected, ${money(d.scheduled)} scheduled`}
                    className={`focus-ring group flex w-full flex-1 flex-col items-center justify-end rounded-md px-0.5 sm:px-1.5 ${hover === i ? "bg-sand" : ""}`}
                  >
                    <span className="flex w-full max-w-10 flex-col justify-end gap-[2px]">
                      {d.scheduled > 0 && <span className="w-full rounded-t-[4px]" style={{ height: tall(d.scheduled), background: HATCH }} />}
                      {d.paid > 0 && (
                        <span className={`w-full bg-brand ${d.scheduled > 0 ? "" : "rounded-t-[4px]"}`} style={{ height: tall(d.paid) }} />
                      )}
                      {total === 0 && <span className="h-[2px] w-full rounded-full bg-line" />}
                    </span>
                  </button>
                  <span className={`mt-2 h-4 caption-5 ${d.current ? "font-semibold text-ink" : "text-ink-3"}`}>{d.label}</span>
                </li>
              );
            })}
          </ul>
          {h && hover !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-xl border border-line bg-paper p-2 shadow-lg"
              style={{ left: `clamp(88px, ${((hover + 0.5) / data.length) * 100}%, calc(100% - 88px))` }}
            >
              <p className="title-5 text-ink">{h.label}</p>
              <p className="flex justify-between caption-5 text-ink-2">
                Collected <span className="text-ink">{money(h.paid)}</span>
              </p>
              <p className="flex justify-between caption-5 text-ink-2">
                Scheduled <span className="text-ink">{money(h.scheduled)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <figcaption className="sr-only">Monthly rent and fees, collected and scheduled.</figcaption>
    </figure>
  );
}

/** A single proportion as a ring, with the number in the middle. */
export function Ring({ value, label, sub, size = 112 }: { value: number; label: string; sub?: string; size?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${label}: ${Math.round(pct * 100)}%`} className="shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-brand-soft)" strokeWidth="10" />
        {pct > 0 && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
            className="transition-[stroke-dasharray] duration-700 ease-base"
          />
        )}
        <text x="50" y="50" transform="rotate(90 50 50)" textAnchor="middle" dominantBaseline="central" className="fill-ink text-[22px] font-semibold">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div>
        <p className="title-4 text-ink">{label}</p>
        {sub && <p className="mt-1 caption-5 text-ink-2">{sub}</p>}
      </div>
    </div>
  );
}

/** Horizontal bars for ranking a few items; value labels sit at the end of each bar. */
export function RankBars({ rows, format = money, empty }: { rows: { key: string; label: string; value: number; note?: string }[]; format?: (n: number) => string; empty?: ReactNode }) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (!rows.length) return <>{empty}</>;
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate body-5 text-ink">{r.label}</span>
            <span className="shrink-0 body-4 text-ink">{format(r.value)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-sand" aria-hidden>
            <div className="h-2 rounded-full bg-brand transition-[width] duration-700 ease-base" style={{ width: `${max ? Math.max((r.value / max) * 100, 2) : 0}%` }} />
          </div>
          {r.note && <p className="mt-1 caption-5 text-ink-3">{r.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Part to whole for two to four named parts; each segment is labeled, legend below. */
export function SplitBar({ parts }: { parts: { label: string; value: number; fill: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-sand" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
        {total > 0 &&
          parts
            .filter((p) => p.value > 0)
            .map((p) => <span key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.fill }} className="h-full first:rounded-l-full last:rounded-r-full" />)}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: p.fill }} />
            <span className="caption-4 text-ink-2">{p.label}</span>
            <span className="ml-auto title-5 text-ink">
              {p.value}
              {total > 0 && <span className="text-ink-3"> · {Math.round((p.value / total) * 100)}%</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiny trend line for a stat tile. Decorative: the tile states the number. */
export function Spark({ values }: { values: number[] }) {
  if (values.length < 2 || values.every((v) => v === 0)) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-24" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
