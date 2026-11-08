"use client";

import { useState } from "react";
import { DEFAULT_YIELD, blended, leaseOnly } from "@/lib/yield";

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

/**
 * One question for owners: how much more could I make by renting furnished
 * between leases? Three inputs, one answer. Other costs use typical values.
 */
export function EarningsEstimate() {
  const [leaseRent, setLeaseRent] = useState(DEFAULT_YIELD.leaseRent);
  const [furnishedRate, setFurnishedRate] = useState(DEFAULT_YIELD.furnishedRate);
  const [months, setMonths] = useState(DEFAULT_YIELD.blendMonths);

  const inputs = { ...DEFAULT_YIELD, leaseRent, furnishedRate, blendMonths: months };
  const lease = leaseOnly(inputs).noi;
  const blend = blended(inputs).noi;
  const gain = blend - lease;

  const field = (id: string, label: string, value: number, set: (n: number) => void) => (
    <label htmlFor={id} className="flex flex-col gap-1 rounded-2xl bg-paper px-4 py-3">
      <span className="caption-5 text-ink-2">{label}</span>
      <span className="flex items-center gap-1 subhead text-ink">
        <span className="text-ink-3">$</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={50}
          value={value || ""}
          onChange={(e) => set(Math.max(Number(e.target.value) || 0, 0))}
          className="w-full bg-transparent outline-none"
        />
      </span>
    </label>
  );

  return (
    <div className="grid gap-8 rounded-3xl bg-paper p-6 shadow-sm md:p-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div>
        <h2 id="earn-title" className="heading-2 text-ink">
          Lease it, and fill the gaps
        </h2>
        <p className="mt-4 max-w-[52ch] body-3 text-ink-2">
          Rent furnished for a few months a year, between tenants, and keep a lease the rest of the time. See what that adds.
        </p>
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          {field("e-lease", "Lease rent a month", leaseRent, setLeaseRent)}
          {field("e-furn", "Furnished rate a month", furnishedRate, setFurnishedRate)}
        </div>
        <label htmlFor="e-months" className="mt-6 block title-4 text-ink">
          Furnished {months} {months === 1 ? "month" : "months"} a year
        </label>
        <input
          id="e-months"
          type="range"
          min={0}
          max={12}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-brand)]"
        />
      </div>

      <div className="rounded-2xl bg-sand p-6 md:p-8" aria-live="polite">
        <p className="caption-3 text-ink-2">Extra net income a year</p>
        <p className={`mt-2 heading-1 ${gain >= 0 ? "text-ink" : "text-error"}`}>
          {gain >= 0 ? "+" : ""}
          {money(gain)}
        </p>
        <dl className="mt-6 flex flex-col gap-2 body-6">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Lease only</dt>
            <dd className="text-ink">{money(lease)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Lease plus furnished stays</dt>
            <dd className="text-ink">{money(blend)}</dd>
          </div>
        </dl>
        <p className="mt-6 caption-5 text-ink-3">
          After typical costs: furnishing spread over five years, utilities and cleaning while furnished, an empty month
          between tenants on a lease only, and payment fees. An estimate, not financial advice.
        </p>
      </div>
    </div>
  );
}
