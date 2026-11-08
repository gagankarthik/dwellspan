"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { bridgePlan, crossover, furnishedPlan, leasePlan, monthlyCost, type Plan } from "@/lib/costs";
import { listings, type Listing } from "@/lib/listings";
import { sampleHome } from "@/lib/listingDetails";
import { ArrowIcon, CheckIcon } from "./icons";
import { Select } from "./Select";

type Home = Listing;
const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const LAUNCH_CITY = "Austin";
const HORIZONS = [1, 2, 3, 4, 6, 9, 12, 15, 18, 24];

/** Sample homes carry their fees and deposit on the detail record. */
const withDetail = (l: Listing): Home => {
  const d = sampleHome(l.id);
  return d ? { ...l, fees: d.fees, deposit: d.deposit } : l;
};

const cheapest = (rows: Home[]) => [...rows].sort((a, b) => monthlyCost(a).total - monthlyCost(b).total)[0];

export function CompareSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" aria-busy="true" aria-label="Loading comparison">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-line" />
      <div className="mt-8 h-32 animate-pulse rounded-2xl bg-line" />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-96 animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
    </div>
  );
}

/**
 * The wedge: what a furnished stay really costs next to an empty lease, for the
 * months you plan to stay, furniture and utilities included. Every choice lives
 * in the URL so a comparison can be shared.
 */
export function Compare() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [published, setPublished] = useState<Listing[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/listings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((d: { listings: Listing[] }) => alive && setPublished(d.listings))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const homes = useMemo(() => [...published, ...listings.map(withDetail)], [published]);
  const cities = useMemo(() => [...new Set(homes.map((h) => h.city.split(",")[0]))].sort(), [homes]);

  const city = params.get("city") ?? LAUNCH_CITY;
  const months = Math.min(Math.max(Number(params.get("months") ?? 12) || 12, 1), 24);
  const first = Math.min(Math.max(Number(params.get("first") ?? 3) || 3, 1), 11);
  const keep = params.get("keep") === "1";

  const inCity = homes.filter((h) => h.city.toLowerCase().startsWith(city.toLowerCase()));
  const stays = (inCity.some((h) => h.type === "monthly") ? inCity : homes).filter((h) => h.type === "monthly");
  const leases = (inCity.some((h) => h.type === "yearly") ? inCity : homes).filter((h) => h.type === "yearly");

  const stay = stays.find((h) => h.id === params.get("stay")) ?? cheapest(stays);
  // Default lease: same bedroom count as the stay when there is one, so the pair is like for like.
  const lease =
    leases.find((h) => h.id === params.get("lease")) ??
    cheapest(leases.filter((h) => stay && h.beds === stay.beds)) ??
    cheapest(leases);

  function set(next: Record<string, string | number | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, String(v));
    }
    router.replace(`${pathname}?${p}`, { scroll: false });
  }

  if (!stay || !lease) return <CompareSkeleton />;

  const plans: Plan[] = [furnishedPlan(stay, months), leasePlan(lease, months, keep), bridgePlan(stay, lease, months, first, keep)];
  const [, leaseP, bridgeP] = plans;
  if (bridgeP.available && bridgeP.total > leaseP.total) {
    const f = Math.max(first, stay.minMonths);
    bridgeP.note = `${money(bridgeP.total - leaseP.total)} more than signing a lease sight unseen. That buys you ${f} ${f === 1 ? "month" : "months"} to learn the city and pick a neighborhood before you commit. One Renter Passport covers both applications.`;
  }
  const live = plans.filter((p) => p.available);
  const best = live.reduce((a, b) => (b.total < a.total ? b : a));
  const cross = crossover(stay, lease, keep);
  const sameCity = stay.city === lease.city;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <header className="max-w-3xl">
        <p className="caption-3 text-brand">The honest math</p>
        <h1 className="mt-2 heading-1 text-ink">Furnished stay or lease?</h1>
        <p className="mt-4 lead text-ink-2">
          Rent is only part of it. We add the utilities you would pay, the furniture an empty home needs, and what it costs
          to leave a lease early, so you compare the real cost of the months you plan to stay.
        </p>
      </header>

      {/* Inputs */}
      <section aria-label="Your move" className="mt-8 grid gap-4 rounded-2xl bg-sand p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span id="c-city" className="caption-3 text-ink">
            City
          </span>
          <Select
            className="mt-2"
            labelId="c-city"
            value={cities.find((c) => c.toLowerCase() === city.toLowerCase()) ?? city}
            onChange={(v) => set({ city: v, stay: null, lease: null })}
            options={cities.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div>
          <span id="c-months" className="caption-3 text-ink">
            How long you will stay
          </span>
          <Select
            className="mt-2"
            labelId="c-months"
            value={String(months)}
            onChange={(v) => set({ months: v })}
            options={HORIZONS.map((m) => ({ value: String(m), label: `${m} ${m === 1 ? "month" : "months"}` }))}
          />
        </div>
        <div>
          <span id="c-stay" className="caption-3 text-ink">
            Furnished stay
          </span>
          <Select
            className="mt-2"
            labelId="c-stay"
            value={stay.id}
            onChange={(v) => set({ stay: v })}
            options={stays.map((h) => ({ value: h.id, label: h.title, note: `${money(h.price)}/mo · ${h.area}` }))}
          />
        </div>
        <div>
          <span id="c-lease" className="caption-3 text-ink">
            Lease
          </span>
          <Select
            className="mt-2"
            labelId="c-lease"
            value={lease.id}
            onChange={(v) => set({ lease: v })}
            options={leases.map((h) => ({ value: h.id, label: h.title, note: `${money(h.price)}/mo · ${h.area}` }))}
          />
        </div>
        <div className="sm:col-span-2">
          <span id="c-first" className="caption-3 text-ink">
            If you start furnished, switch to the lease after
          </span>
          <Select
            className="mt-2"
            labelId="c-first"
            value={String(first)}
            onChange={(v) => set({ first: v })}
            options={[1, 2, 3, 4, 5, 6].map((m) => ({ value: String(m), label: `${m} ${m === 1 ? "month" : "months"}` }))}
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3 self-end rounded-xl bg-paper p-4 sm:col-span-2">
          <input
            type="checkbox"
            checked={keep}
            onChange={(e) => set({ keep: e.target.checked ? "1" : null })}
            className="mt-1 size-4 accent-[var(--color-brand)]"
          />
          <span>
            <span className="title-4 text-ink">I will keep the furniture I buy</span>
            <span className="block caption-5 text-ink-3">
              Off: we assume you sell it for about a third of what you paid when you leave.
            </span>
          </span>
        </label>
      </section>

      {!sameCity && (
        <p className="mt-4 caption-2 text-ink-3">
          We do not have both stay types in {city} yet, so one side of this comparison is from another city.
        </p>
      )}

      {/* Verdict */}
      <section aria-live="polite" className="mt-8 rounded-2xl bg-ink p-6 text-paper md:p-8">
        <p className="caption-3 text-muted">For {months} {months === 1 ? "month" : "months"}</p>
        <p className="mt-2 heading-3">
          {best.title} is cheapest at {money(best.total)}, about {money(best.perMonth)} a month.
        </p>
        <p className="mt-2 body-6 text-muted">
          {cross
            ? `With these two homes, the lease costs less once you stay ${cross} months or longer.`
            : "With these two homes, the furnished stay costs less for any stay up to two years."}{" "}
          Refundable deposits are shown on each plan and are not counted as cost.
        </p>
      </section>

      {/* Plans */}
      <ul className="mt-8 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <li key={p.key}>
            <PlanCard plan={p} best={p.available && p.key === best.key} home={p.key === "lease" ? lease : stay} second={p.key === "bridge" ? lease : undefined} />
          </li>
        ))}
      </ul>

      <CostChart stay={stay} lease={lease} keep={keep} months={months} />

      <p className="mt-8 max-w-[72ch] caption-5 text-ink-3">
        Estimates: utility bills use typical costs for a home of that size in that city. Furniture uses a typical cost to set
        up a home with that many bedrooms. Leaving a lease early costs the lesser of the remaining rent or two months of rent,
        a common break fee; check the lease you sign. Pet rent and application fees are left out.
      </p>
    </div>
  );
}

function PlanCard({ plan: p, best, home, second }: { plan: Plan; best: boolean; home: Home; second?: Home }) {
  const tone = p.key === "furnished" ? "text-brand" : p.key === "lease" ? "text-amber" : "text-ink";
  return (
    <article className={`flex h-full flex-col rounded-2xl border bg-paper p-6 ${best ? "border-ink shadow-xl" : "border-line"}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={`title-2 ${tone}`}>{p.title}</h2>
        {best && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-1 caption-3 text-paper">
            <CheckIcon className="size-3" strokeWidth={2.5} /> Cheapest
          </span>
        )}
      </div>
      {p.available ? (
        <>
          <p className="mt-4 text-ink">
            <span className="heading-2">{money(p.total)}</span>
            <span className="body-6 text-ink-2"> total</span>
          </p>
          <p className="caption-2 text-ink-3">{money(p.perMonth)} a month on average</p>
          <ul className="mt-6 flex flex-1 flex-col">
            {p.lines.map((x) => (
              <li key={x.label} className="flex justify-between gap-4 border-b border-line py-2 body-6 last:border-0">
                <span className="text-ink-2">
                  {x.label}
                  {x.estimate && <span className="ml-1 caption-5 text-ink-3">(est.)</span>}
                </span>
                <span className={x.amount < 0 ? "text-[#17663a]" : "text-ink"}>{money(x.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 caption-5 text-ink-3">Refundable deposit: {p.deposits ? money(p.deposits) : "none"}</p>
          {p.note && <p className="mt-2 caption-5 text-ink-2">{p.note}</p>}
        </>
      ) : (
        <p className="mt-4 flex-1 body-6 text-ink-2">{p.note}</p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <Link href={`/homes/${home.id}`} className="focus-ring inline-flex items-center gap-2 rounded body-5 text-ink hover:underline hover:underline-offset-4">
          {home.title} <ArrowIcon className="size-4" />
        </Link>
        {second && (
          <Link href={`/homes/${second.id}`} className="focus-ring inline-flex items-center gap-2 rounded body-5 text-ink hover:underline hover:underline-offset-4">
            then {second.title} <ArrowIcon className="size-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

/** Total spent by month for each path. Where the lines cross is when the lease starts to win. */
function CostChart({ stay, lease, keep, months }: { stay: Home; lease: Home; keep: boolean; months: number }) {
  const N = 24;
  const xs = Array.from({ length: N }, (_, i) => i + 1);
  const a = xs.map((n) => furnishedPlan(stay, n).total);
  const b = xs.map((n) => leasePlan(lease, n, keep).total);
  const top = Math.max(...a, ...b);
  const W = 640;
  const H = 240;
  const P = { l: 56, r: 16, t: 16, b: 32 };
  const x = (n: number) => P.l + ((n - 1) / (N - 1)) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / top) * (H - P.t - P.b);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round((top * t) / 1000) * 1000);

  return (
    <section aria-labelledby="chart-title" className="mt-12">
      <h2 id="chart-title" className="subhead text-ink">
        Total spent by month
      </h2>
      <p className="mt-2 body-6 text-ink-2">
        A lease front loads furniture and setup, then costs less each month. Leaving early adds rent for the months you skip
        or a break fee.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label={`Furnished total reaches ${money(a[N - 1])} at 24 months; lease total reaches ${money(b[N - 1])}.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
              <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-3)">
                {t >= 1000 ? `$${t / 1000}k` : "$0"}
              </text>
            </g>
          ))}
          {[1, 6, 12, 18, 24].map((n) => (
            <text key={n} x={x(n)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--color-ink-3)">
              {n} mo
            </text>
          ))}
          <line x1={x(months)} x2={x(months)} y1={P.t} y2={H - P.b} stroke="var(--color-ink-3)" strokeDasharray="4 4" />
          <path d={path(a)} fill="none" stroke="var(--color-brand)" strokeWidth={2.5} />
          <path d={path(b)} fill="none" stroke="var(--color-amber)" strokeWidth={2.5} />
          <circle cx={x(months)} cy={y(a[months - 1])} r={4} fill="var(--color-brand)" />
          <circle cx={x(months)} cy={y(b[months - 1])} r={4} fill="var(--color-amber)" />
        </svg>
        <ul className="mt-2 flex flex-wrap gap-4 caption-4 text-ink-2">
          <li className="flex items-center gap-2">
            <span className="h-1 w-4 rounded bg-brand" aria-hidden /> Furnished stay
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1 w-4 rounded bg-amber" aria-hidden /> Lease
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-0 border-l border-dashed border-ink-3" aria-hidden /> Your stay length
          </li>
        </ul>
      </div>
    </section>
  );
}
