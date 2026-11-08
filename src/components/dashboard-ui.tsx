"use client";

import type { ReactNode } from "react";
import { PlusIcon } from "./icons";
import { openListProperty } from "./PropertyTypeDialog";

export const money = (n: number, cents = false) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;
export const compactMoney = (n: number) =>
  Math.abs(n) >= 10000 ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : money(n);
export const pretty = (iso: string, withYear = true) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const monthKey = (iso: string) => iso.slice(0, 7);
export const monthLabel = (key: string, long = false) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString("en-US", { month: long ? "long" : "short", ...(long ? { year: "numeric" } : {}) });
/** YYYY-MM shifted by n months. */
export function shiftMonth(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function ViewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your dashboard">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-line" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-line lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-line" />
      </div>
    </div>
  );
}

export function PageHeader({ title, intro, action }: { title: string; intro?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="heading-2 text-ink">{title}</h1>
        {intro && <p className="mt-2 max-w-[60ch] body-6 text-ink-2">{intro}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export const AddPropertyButton = ({ label = "List a property" }: { label?: string }) => (
  <button type="button" onClick={() => openListProperty()} className="btn-primary button-sm h-10 px-4!">
    <PlusIcon className="size-4" strokeWidth={2.25} /> {label}
  </button>
);

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line/70 bg-paper p-6 shadow-sm ${className}`} aria-label={title}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="title-3 text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line/70 bg-paper px-6 py-16 text-center shadow-sm">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</span>
      <p className="mt-4 subhead text-ink">{title}</p>
      <p className="mt-2 max-w-[52ch] body-6 text-ink-2">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Segmented filter. Counts are part of the accessible name. */
export function Tabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-paper p-1 shadow-sm">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`focus-ring flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 body-5 transition-colors duration-300 ease-base ${
              on ? "bg-ink text-paper" : "text-ink-2 hover:bg-sand hover:text-ink"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`caption-3 ${on ? "text-paper/80" : "text-ink-3"}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

const PILL: Record<string, string> = {
  neutral: "bg-sand text-ink-2",
  brand: "bg-brand-soft text-brand",
  good: "bg-[#e7f5ec] text-[#17663a]",
  warn: "bg-[#fdf3e1] text-[#8a5300]",
  bad: "bg-[#fdf1f0] text-error",
};
export function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL; children: ReactNode }) {
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 caption-3 ${PILL[tone]}`}>{children}</span>;
}

export function Notice({ text, tone = "info" }: { text: string; tone?: "info" | "error" }) {
  if (!text) return null;
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-2 body-6 shadow-sm ${tone === "error" ? "bg-[#fdf1f0] text-error" : "bg-paper text-ink"}`}>
      {text}
    </p>
  );
}

export const fieldCls =
  "focus-ring h-12 w-full rounded-xl border border-line bg-paper px-4 body-6 text-ink placeholder:text-ink-3 transition-colors duration-300 ease-base hover:border-ink-3";

export function Field({ label, error, children, htmlFor, hint }: { label: string; error?: string; children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="title-4 text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="caption-5 text-ink-3">{hint}</p>}
      {error && <p className="caption-5 text-error">{error}</p>}
    </div>
  );
}

/** CSV download built in the browser. */
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
