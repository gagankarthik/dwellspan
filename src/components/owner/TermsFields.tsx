"use client";

import { Select } from "../Select";
import { FREQUENCY_LABEL, FREQUENCIES, METHOD_LABEL, METHODS, describeTerms, type PaymentTerms } from "@/lib/terms";
import { fieldCls } from "./ui";

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
const DUE_DAYS = [{ value: "0", label: "Move in day each period" }, ...Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${ordinal(i + 1)} of the month` }))];

/** Payment terms: how often, which day, how they pay, and an optional late fee. */
export function TermsFields({ value, onChange, idPrefix }: { value: PaymentTerms; onChange: (t: PaymentTerms) => void; idPrefix: string }) {
  const set = <K extends keyof PaymentTerms>(k: K, v: PaymentTerms[K]) => onChange({ ...value, [k]: v });
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl bg-sand p-4">
      <legend className="sr-only">Payment terms</legend>
      <p className="title-4 text-ink" aria-hidden>
        Payment terms
      </p>
      <div role="radiogroup" aria-label="How often they pay" className="grid grid-cols-2 gap-1 rounded-xl bg-paper p-1 sm:grid-cols-4">
        {FREQUENCIES.map((f) => (
          <label key={f} className="cursor-pointer">
            <input type="radio" name={`${idPrefix}-freq`} checked={value.frequency === f} onChange={() => onChange({ ...value, frequency: f, dueDay: f === "full" ? 0 : value.dueDay })} className="peer sr-only" />
            <span className="flex h-9 items-center justify-center rounded-lg px-2 text-center caption-1 text-ink-2 transition-colors duration-300 ease-base peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
              {FREQUENCY_LABEL[f]}
            </span>
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span id={`${idPrefix}-due`} className="caption-1 text-ink">
            Due
          </span>
          <div className="mt-1">
            <Select labelId={`${idPrefix}-due`} value={String(value.dueDay)} onChange={(v) => set("dueDay", Number(v))} options={value.frequency === "full" ? [{ value: "0", label: "On move in" }] : DUE_DAYS} />
          </div>
        </div>
        <div>
          <span id={`${idPrefix}-method`} className="caption-1 text-ink">
            Paid by
          </span>
          <div className="mt-1">
            <Select labelId={`${idPrefix}-method`} value={value.method} onChange={(v) => set("method", v as PaymentTerms["method"])} options={METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))} />
          </div>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-late`} className="caption-1 text-ink">
            Late fee (optional)
          </label>
          <input
            id={`${idPrefix}-late`}
            inputMode="numeric"
            value={value.lateFee || ""}
            onChange={(e) => set("lateFee", Number(e.target.value.replace(/\D/g, "")) || 0)}
            className={`${fieldCls} mt-1`}
            placeholder="$0"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-grace`} className="caption-1 text-ink">
            Days before it applies
          </label>
          <input
            id={`${idPrefix}-grace`}
            inputMode="numeric"
            value={value.graceDays}
            disabled={!value.lateFee}
            onChange={(e) => set("graceDays", Math.min(Number(e.target.value.replace(/\D/g, "")) || 0, 30))}
            className={`${fieldCls} mt-1 disabled:bg-sand disabled:text-ink-2`}
          />
        </div>
      </div>
      <p className="caption-5 text-ink-2">{describeTerms(value)}. The first payment is due on move in.</p>
    </fieldset>
  );
}
