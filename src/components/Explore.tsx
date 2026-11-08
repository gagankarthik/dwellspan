"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { monthlyCost } from "@/lib/costs";
import { listings, type Listing } from "@/lib/listings";
import { AMENITY_GROUPS, AMENITY_LIST, amenityLabel } from "@/lib/amenities";
import { metaFor, offers, type ListingMeta, type PetKind, type PropertyKind } from "@/lib/listingDetails";
import { DatePicker } from "./DatePicker";
import { LENGTH_OPTIONS } from "./HeroSearch";
import { ChevronIcon, HomeIcon, SearchIcon, StarIcon } from "./icons";
import { AmenityKeyIcon } from "./amenityIcon";
import { ListingCard } from "./ListingCard";
import { PROPERTY_TYPE_OPTIONS } from "./propertyTypes";
import { Select } from "./Select";

/* ------------------------------------------------------------------ */
/* Filter model: every value lives in the URL                          */
/* ------------------------------------------------------------------ */

type Filters = {
  q: string;
  type: "all" | "monthly" | "yearly";
  months: number;
  min: number;
  max: number;
  beds: string; // "", "0" studio, "1".."4" at least
  baths: number; // 0 any, else at least
  moveIn: string;
  rating: number; // 0 any
  kinds: PropertyKind[];
  pets: "" | "friendly" | PetKind;
  amenities: string[];
  kw: string;
  sort: string;
};

const list = (v: string | null) => (v ?? "").split(",").filter(Boolean);

function readFilters(p: URLSearchParams): Filters {
  const t = p.get("type");
  return {
    q: p.get("q") ?? p.get("city") ?? "",
    type: t === "monthly" || t === "yearly" ? t : "all",
    months: Number(p.get("months") ?? 0),
    min: Number(p.get("min") ?? 0),
    max: Number(p.get("max") ?? 0),
    beds: p.get("beds") ?? "",
    baths: Number(p.get("baths") ?? 0),
    moveIn: p.get("moveIn") ?? "",
    rating: Number(p.get("rating") ?? 0),
    kinds: list(p.get("ptype")) as PropertyKind[],
    pets: (p.get("pets") ?? "") as Filters["pets"],
    amenities: list(p.get("am")),
    kw: p.get("kw") ?? "",
    sort: p.get("sort") ?? "recommended",
  };
}

function toParams(f: Filters) {
  const p = new URLSearchParams();
  const set = (k: string, v: string | number, skip: string | number) => {
    if (v !== skip && v !== "") p.set(k, String(v));
  };
  set("q", f.q.trim(), "");
  set("type", f.type, "all");
  set("months", f.months, 0);
  set("min", f.min, 0);
  set("max", f.max, 0);
  set("beds", f.beds, "");
  set("baths", f.baths, 0);
  set("moveIn", f.moveIn, "");
  set("rating", f.rating, 0);
  set("ptype", f.kinds.join(","), "");
  set("pets", f.pets, "");
  set("am", f.amenities.join(","), "");
  set("kw", f.kw.trim(), "");
  set("sort", f.sort, "recommended");
  return p;
}

const EMPTY_PANEL: Pick<Filters, "type" | "months" | "min" | "max" | "beds" | "baths" | "moveIn" | "rating" | "kinds" | "pets" | "amenities" | "kw"> = {
  type: "all",
  months: 0,
  min: 0,
  max: 0,
  beds: "",
  baths: 0,
  moveIn: "",
  rating: 0,
  kinds: [],
  pets: "",
  amenities: [],
  kw: "",
};

type Home = Listing & { meta: ListingMeta };

function matches(h: Home, f: Filters) {
  const needle = f.q.trim().toLowerCase();
  const n = f.months;
  const type = f.type !== "all" ? f.type : n >= 12 ? "yearly" : "all";
  if (type !== "all" && h.type !== type) return false;
  if (needle && !`${h.city} ${h.area} ${h.title}`.toLowerCase().includes(needle)) return false;
  if (n > 0 && n < 12 && h.type === "monthly" && h.minMonths > n) return false;
  if (n > 0 && h.type === "yearly" && !(h.leaseTerms ?? [12]).some((t) => (n >= 12 ? t >= 12 : t === n))) return false;
  if (f.min && h.price < f.min) return false;
  if (f.max && h.price > f.max) return false;
  if (f.beds === "0" && h.beds !== 0) return false;
  if (f.beds && f.beds !== "0" && h.beds < Number(f.beds)) return false;
  if (f.baths && h.baths < f.baths) return false;
  if (f.moveIn && h.meta.availableFrom && h.meta.availableFrom > f.moveIn) return false;
  if (f.moveIn && h.meta.availableUntil && h.meta.availableUntil < f.moveIn) return false;
  if (f.rating && (h.reviews === 0 || h.rating < f.rating)) return false;
  if (f.kinds.length && (!h.meta.kind || !f.kinds.includes(h.meta.kind))) return false;
  if (f.pets === "friendly" && h.meta.pets === "none") return false;
  if (f.pets === "dogs" && !["dogs", "both"].includes(h.meta.pets)) return false;
  if (f.pets === "cats" && !["cats", "both"].includes(h.meta.pets)) return false;
  if (f.pets === "none" && h.meta.pets !== "none") return false;
  if (f.amenities.some((a) => !h.meta.amenities.includes(a))) return false;
  if (f.kw.trim() && !h.meta.text.toLowerCase().includes(f.kw.trim().toLowerCase())) return false;
  return true;
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "allin-asc", label: "All in cost, low to high" },
  { value: "price-asc", label: "Rent, low to high" },
  { value: "price-desc", label: "Rent, high to low" },
  { value: "rating", label: "Highest rated" },
];
const KINDS: [PropertyKind, string][] = PROPERTY_TYPE_OPTIONS.map((t) => [t.value, t.label]);
const PETS: [Filters["pets"], string][] = [
  ["", "Any"],
  ["friendly", "Pet friendly"],
  ["cats", "Cats"],
  ["dogs", "Dogs"],
  ["none", "No pets"],
];

/* ------------------------------------------------------------------ */

export function ExploreSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1760px] px-4 py-16 sm:px-6 lg:px-12" aria-busy="true" aria-label="Loading homes">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-line" />
      <div className="mt-8 h-16 animate-pulse rounded-2xl bg-line" />
      <div className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-line" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-line" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Explore() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [published, setPublished] = useState<Listing[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Filters | null>(null);

  const f = useMemo(() => readFilters(new URLSearchParams(params.toString())), [params]);

  function go(next: Filters) {
    const p = toParams(next);
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  }
  const patch = (x: Partial<Filters>) => go({ ...f, ...x });

  useEffect(() => {
    let alive = true;
    fetch("/api/listings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((d: { listings: Listing[] }) => {
        if (alive) setPublished(d.listings);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const homes: Home[] = useMemo(() => [...published, ...listings].map((l) => ({ ...l, meta: metaFor(l) })), [published]);

  const sortHomes = (rows: Home[], sort: string) => {
    const out = [...rows];
    if (sort === "allin-asc") out.sort((a, b) => monthlyCost(a).total - monthlyCost(b).total);
    if (sort === "price-asc") out.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
    if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
    return out;
  };
  const results = useMemo(() => sortHomes(homes.filter((h) => matches(h, f)), f.sort), [homes, f]);
  const draftCount = useMemo(() => (draft ? homes.filter((h) => matches(h, draft)).length : 0), [homes, draft]);

  // Applied filter chips (panel filters only; quick bar values are visible already)
  const chips: { label: string; clear: Partial<Filters> }[] = [];
  if (f.type !== "all") chips.push({ label: f.type === "monthly" ? "Furnished stays" : "Long term leases", clear: { type: "all" } });
  if (f.months) chips.push({ label: LENGTH_OPTIONS.find((o) => o.value === String(f.months))?.label ?? `${f.months} months`, clear: { months: 0 } });
  if (f.min || f.max)
    chips.push({ label: `${f.min ? money(f.min) : "No min"} to ${f.max ? money(f.max) : "No max"}`, clear: { min: 0, max: 0 } });
  if (f.beds) chips.push({ label: f.beds === "0" ? "Studio" : `${f.beds}+ beds`, clear: { beds: "" } });
  if (f.baths) chips.push({ label: `${f.baths}+ baths`, clear: { baths: 0 } });
  if (f.moveIn)
    chips.push({
      label: `Move in ${new Date(`${f.moveIn}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      clear: { moveIn: "" },
    });
  if (f.rating) chips.push({ label: `${f.rating}+ rating`, clear: { rating: 0 } });
  f.kinds.forEach((k) => chips.push({ label: KINDS.find(([v]) => v === k)?.[1] ?? k, clear: { kinds: f.kinds.filter((x) => x !== k) } }));
  if (f.pets) chips.push({ label: PETS.find(([v]) => v === f.pets)?.[1] ?? f.pets, clear: { pets: "" } });
  f.amenities.forEach((a) =>
    chips.push({ label: amenityLabel(a), clear: { amenities: f.amenities.filter((x) => x !== a) } }),
  );
  if (f.kw) chips.push({ label: `"${f.kw}"`, clear: { kw: "" } });

  function openPanel() {
    setDraft(f);
    dialog.current?.showModal();
  }

  return (
    <div className="mx-auto w-full max-w-[1760px] px-4 py-16 sm:px-6 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-1 text-ink">{f.q ? `Homes in ${f.q}` : "Explore homes"}</h1>
          <p className="mt-2 body-3 text-ink-2" aria-live="polite">
            {results.length} {results.length === 1 ? "home" : "homes"} available
          </p>
        </div>
        <div className="w-56">
          <span id="sort-label" className="sr-only">
            Sort by
          </span>
          <Select labelId="sort-label" value={f.sort} onChange={(v) => patch({ sort: v })} options={SORTS} />
        </div>
      </div>

      {/* Search bar: one surface, labelled segments, same pattern as the landing hero */}
      <SearchBar
        key={f.q}
        f={f}
        patch={patch}
        filterCount={chips.length}
        onOpenFilters={openPanel}
        prices={homes.map((h) => h.price)}
        countFor={(min, max) => homes.filter((h) => matches(h, { ...f, min, max })).length}
      />

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Applied filters">
          {chips.map((c) => (
            <li key={c.label}>
              <button
                type="button"
                onClick={() => patch(c.clear)}
                aria-label={`Remove filter ${c.label}`}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 button-sm text-paper transition-colors duration-300 ease-base hover:bg-[#3a3a3a]"
              >
                {c.label}
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => patch(EMPTY_PANEL)}
              className="focus-ring rounded-full px-4 py-2 button-sm text-ink underline underline-offset-4 hover:text-brand"
            >
              Clear all
            </button>
          </li>
        </ul>
      )}

      {results.some((h) => h.type === "monthly") && results.some((h) => h.type === "yearly") && (
        <Link
          href={`/compare${f.q ? `?city=${encodeURIComponent(f.q)}` : ""}`}
          className="focus-ring group mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sand px-6 py-4 transition-colors duration-300 ease-base hover:bg-brand-soft"
        >
          <span>
            <span className="title-3 text-ink">Furnished stay or lease?</span>
            <span className="mt-1 block body-6 text-ink-2">
              Prices below include fees and estimated utilities. See the full math for your stay length, furniture included.
            </span>
          </span>
          <span className="button-sm text-brand group-hover:underline group-hover:underline-offset-4">Compare the true cost</span>
        </Link>
      )}

      {results.length > 0 ? (
        <ul className="mt-12 grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((l) => (
            <li key={l.id}>
              <ListingCard listing={l} offer={offers[l.id]} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 flex flex-col items-center rounded-3xl bg-sand px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-paper">
            <HomeIcon className="size-6 text-ink-2" />
          </span>
          <h2 className="mt-6 subhead">No homes match these filters yet</h2>
          <p className="mt-2 max-w-[60ch] body-6 text-ink-2">
            Try a wider price range, fewer amenities, or a nearby city. New homes are listed every week.
          </p>
          <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="btn-primary button-sm mt-6">
            Clear all filters
          </button>
        </div>
      )}

      {/* All filters */}
      <dialog
        ref={dialog}
        aria-labelledby="filters-title"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto h-[min(880px,calc(100dvh-32px))] w-[calc(100%-32px)] max-w-2xl overflow-hidden rounded-3xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-[rgb(12_18_40/0.55)]"
      >
        {draft && (
          <FilterPanel
            draft={draft}
            setDraft={setDraft}
            homes={homes}
            count={draftCount}
            onClose={() => dialog.current?.close()}
            onApply={() => {
              go(draft);
              dialog.current?.close();
            }}
          />
        )}
      </dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="py-4 first:pt-0">
      <legend className="title-3 text-ink">{title}</legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

function Pill({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 button-xsm transition-colors duration-300 ease-base active:scale-[0.98] ${
        on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function FilterPanel({
  draft: d,
  setDraft,
  homes,
  count,
  onClose,
  onApply,
}: {
  draft: Filters;
  setDraft: (f: Filters) => void;
  homes: Home[];
  count: number;
  onClose: () => void;
  onApply: () => void;
}) {
  const [moreAmenities, setMoreAmenities] = useState(false);
  const set = (x: Partial<Filters>) => setDraft({ ...d, ...x });
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // Price scale from the real inventory, rounded to friendly steps.
  const prices = homes.map((h) => h.price).filter(Boolean);
  const LO = Math.floor(Math.min(...prices) / 500) * 500;
  const HI = Math.ceil(Math.max(...prices) / 500) * 500;
  const STEP = 50;
  const BINS = 24;
  const binW = (HI - LO) / BINS;
  const bins = Array.from({ length: BINS }, (_, i) => prices.filter((p) => p >= LO + i * binW && p < LO + (i + 1) * binW).length);
  const peak = Math.max(...bins, 1);
  const lo = d.min || LO;
  const hi = d.max || HI;
  const pct = (v: number) => ((v - LO) / (HI - LO)) * 100;

  return (
    <div className="flex h-full flex-col">
      <header className="relative flex h-16 shrink-0 items-center justify-center">
        <h2 id="filters-title" className="title-3 text-ink">
          Filters
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className="focus-ring absolute top-1/2 right-4 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink transition-colors duration-300 ease-base hover:bg-sand"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div className="flex-1 divide-y divide-line overflow-y-auto px-6 pb-6 sm:px-8">
        {/* Stay type and length */}
        <Section title="Stay type">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Any"],
                ["monthly", "Furnished stays"],
                ["yearly", "Long term leases"],
              ] as const
            ).map(([v, label]) => (
              <Pill key={v} on={d.type === v} onClick={() => set({ type: v })}>
                {label}
              </Pill>
            ))}
          </div>
          <div className="mt-4 max-w-[320px]">
            <span id="p-len-label" className="caption-3 text-ink-3">
              Stay length
            </span>
            <Select className="mt-2" size="sm" labelId="p-len-label" value={String(d.months)} onChange={(v) => set({ months: Number(v) })} options={LENGTH_OPTIONS} />
          </div>
        </Section>

        {/* Price */}
        <Section title="Price">
          <p className="body-6 text-ink-2">Monthly rent, before any fees.</p>
          <div className="mt-4 flex h-12 items-end gap-1" aria-hidden>
            {bins.map((b, i) => {
              const mid = LO + (i + 0.5) * binW;
              const inRange = mid >= lo && mid <= hi;
              return (
                <span
                  key={i}
                  className={`flex-1 rounded-t ${inRange ? "bg-brand" : "bg-line"}`}
                  style={{ height: `${Math.max(b ? (b / peak) * 100 : 0, 4)}%` }}
                />
              );
            })}
          </div>
          <div className="relative h-6">
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink"
              style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
            />
            <input
              type="range"
              aria-label="Minimum price"
              min={LO}
              max={HI}
              step={STEP}
              value={lo}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), hi - STEP);
                set({ min: v <= LO ? 0 : v });
              }}
              className="range-thumb absolute inset-0 h-6 w-full"
            />
            <input
              type="range"
              aria-label="Maximum price"
              min={LO}
              max={HI}
              step={STEP}
              value={hi}
              onChange={(e) => {
                const v = Math.max(Number(e.target.value), lo + STEP);
                set({ max: v >= HI ? 0 : v });
              }}
              className="range-thumb absolute inset-0 h-6 w-full"
            />
          </div>
          <div className="mt-2 flex justify-between caption-2 text-ink-3">
            <span>{money(LO)}</span>
            <span>{money(HI)}+</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(
              [
                ["min", "Minimum", "No min"],
                ["max", "Maximum", "No max"],
              ] as const
            ).map(([k, label, ph]) => (
              <label key={k} className="block rounded-lg border border-line px-4 py-1 transition-colors duration-300 ease-base focus-within:border-ink hover:border-ink-3">
                <span className="block caption-3 text-ink-3">{label}</span>
                <span className="flex items-center gap-1 body-6 text-ink">
                  $
                  <input
                    inputMode="numeric"
                    value={d[k] ? d[k].toLocaleString("en-US") : ""}
                    placeholder={ph}
                    onChange={(e) => set({ [k]: Number(e.target.value.replace(/[^\d]/g, "").slice(0, 6)) || 0 })}
                    className="w-full bg-transparent placeholder:text-ink-3 focus:outline-none"
                  />
                </span>
              </label>
            ))}
          </div>
          {d.min > 0 && d.max > 0 && d.min > d.max && (
            <p className="mt-2 caption-2 text-error">The minimum is higher than the maximum. Swap them or adjust one.</p>
          )}
        </Section>

        {/* Beds and baths */}
        <Section title="Bedrooms">
          <div className="flex flex-wrap gap-2">
            {[
              ["", "Any"],
              ["0", "Studio"],
              ["1", "1 bed"],
              ["2", "2 beds"],
              ["3", "3 beds"],
              ["4", "4+ beds"],
            ].map(([v, label]) => (
              <Pill key={v} on={d.beds === v} onClick={() => set({ beds: v })}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>
        <Section title="Bathrooms">
          <div className="flex flex-wrap gap-2">
            {[
              [0, "Any"],
              [1, "1+ bath"],
              [2, "2+ baths"],
              [3, "3+ baths"],
            ].map(([v, label]) => (
              <Pill key={v} on={d.baths === v} onClick={() => set({ baths: v as number })}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>

        {/* Move in */}
        <Section title="Move in date">
          <p className="body-6 text-ink-2">Only show homes available on or before this date.</p>
          <div className="mt-4 max-w-[320px]">
            <DatePicker ariaLabel="Move in date" value={d.moveIn} onChange={(v) => set({ moveIn: v })} placeholder="Select date" />
          </div>
        </Section>

        {/* Rating */}
        <Section title="Property rating">
          <div className="flex flex-wrap gap-2">
            {[0, 4, 4.5, 4.8].map((r) => (
              <Pill key={r} on={d.rating === r} onClick={() => set({ rating: r })} label={r ? `${r} stars and up` : "Any rating"}>
                {r ? (
                  <>
                    <StarIcon className="size-4" /> {r}+
                  </>
                ) : (
                  "Any"
                )}
              </Pill>
            ))}
          </div>
        </Section>

        {/* Property type */}
        <Section title="Property type">
          <div className="flex flex-wrap gap-2">
            <Pill on={d.kinds.length === 0} onClick={() => set({ kinds: [] })}>
              Any
            </Pill>
            {KINDS.map(([v, label]) => (
              <Pill key={v} on={d.kinds.includes(v)} onClick={() => set({ kinds: toggle(d.kinds, v) })}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>

        {/* Pets */}
        <Section title="Pet policy">
          <div className="flex flex-wrap gap-2">
            {PETS.map(([v, label]) => (
              <Pill key={label} on={d.pets === v} onClick={() => set({ pets: v })}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>

        {/* Amenities */}
        <Section title="Amenities">
          <div className="flex flex-col gap-4">
            {(moreAmenities ? AMENITY_GROUPS : AMENITY_GROUPS.slice(0, 2)).map((g) => (
              <div key={g.title}>
                <p className="caption-3 text-ink-3">{g.title}</p>
                <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
                  {g.items.map((a) => (
                    <label key={a.key} className="flex cursor-pointer items-center gap-2 rounded-lg py-1 body-6 text-ink">
                      <input
                        type="checkbox"
                        checked={d.amenities.includes(a.key)}
                        onChange={() => set({ amenities: toggle(d.amenities, a.key) })}
                        className="size-4 shrink-0 accent-[#1f1f1f]"
                      />
                      <AmenityKeyIcon k={a.key} className="size-4 shrink-0 text-ink-2" />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMoreAmenities((v) => !v)}
            aria-expanded={moreAmenities}
            className="focus-ring mt-4 rounded body-5 text-ink underline underline-offset-4 hover:text-brand"
          >
            {moreAmenities ? "Show fewer amenities" : `Show all ${AMENITY_LIST.length} amenities`}
          </button>
        </Section>

        {/* Keywords */}
        <Section title="Keywords">
          <label htmlFor="f-kw" className="sr-only">
            Property name or keyword
          </label>
          <input
            id="f-kw"
            value={d.kw}
            onChange={(e) => set({ kw: e.target.value })}
            placeholder="Property name or keyword, like loft or pool"
            className="focus-ring h-10 w-full rounded-lg border border-line bg-paper px-4 body-6 text-ink placeholder:text-ink-3 transition-colors duration-300 ease-base hover:border-ink-3"
          />
        </Section>
      </div>

      <footer className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 shadow-[0_-4px_8px_rgb(20_33_82/0.06)] sm:px-8">
        <button
          type="button"
          onClick={() => setDraft({ ...d, ...EMPTY_PANEL })}
          className="focus-ring rounded body-4 text-ink underline underline-offset-4 hover:text-brand"
        >
          Clear all
        </button>
        <button type="button" onClick={onApply} className="btn-primary button-sm h-10 px-6!">
          Show {count} {count === 1 ? "home" : "homes"}
        </button>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PricePopover({
  min,
  max,
  onApply,
  labelId,
  prices,
  countFor,
}: {
  min: number;
  max: number;
  onApply: (min: number, max: number) => void;
  labelId?: string;
  /** every listed rent, for the chart and the slider range */
  prices: number[];
  /** how many homes a range would show, with every other filter kept */
  countFor: (min: number, max: number) => number;
}) {
  const [open, setOpen] = useState(false);
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Scale from the real inventory, rounded to friendly steps
  const valid = prices.filter(Boolean);
  const LO = valid.length ? Math.floor(Math.min(...valid) / 500) * 500 : 0;
  const HI = valid.length ? Math.ceil(Math.max(...valid) / 500) * 500 : 5000;
  const STEP = 50;
  const BINS = 20;
  const binW = (HI - LO) / BINS || 1;
  const bins = Array.from({ length: BINS }, (_, i) => valid.filter((v) => v >= LO + i * binW && v < LO + (i + 1) * binW).length);
  const peak = Math.max(...bins, 1);
  const sorted = [...valid].sort((x, y) => x - y);
  const typical = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  const a = lo || LO;
  const b = hi || HI;
  const pct = (v: number) => ((v - LO) / (HI - LO || 1)) * 100;
  const bad = lo > 0 && hi > 0 && lo > hi;
  const count = bad ? 0 : countFor(lo, hi);

  const label = min || max ? `${min ? money(min) : "No min"} to ${max ? money(max) : "No max"}` : "Any price";
  const presets: [number, number, string][] = [
    [0, 2000, "Under $2,000"],
    [2000, 3000, "$2,000 to $3,000"],
    [3000, 4000, "$3,000 to $4,000"],
    [4000, 0, "$4,000 and up"],
  ];

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => {
          setLo(min);
          setHi(max);
          setOpen((v) => !v);
        }}
        className={`flex w-full items-center justify-between gap-2 bg-transparent text-left body-6 focus:outline-none ${
          min || max ? "text-ink" : "text-ink-3"
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronIcon className={`size-4 shrink-0 text-ink-3 transition-transform duration-500 ease-base ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Price range"
          className="absolute top-full -left-6 z-40 mt-6 w-[min(380px,calc(100vw-32px))] animate-swap rounded-3xl border border-line bg-paper shadow-2xl"
        >
          <div className="p-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="title-3 text-ink">Price per month</p>
              {typical > 0 && <p className="caption-2 text-ink-3">Typical rent {money(typical)}</p>}
            </div>

            {/* Chart and slider */}
            <div className="mt-6 flex h-12 items-end gap-1" aria-hidden>
              {bins.map((n, i) => {
                const mid = LO + (i + 0.5) * binW;
                return (
                  <span
                    key={i}
                    className={`flex-1 rounded-t transition-colors duration-300 ease-base ${mid >= a && mid <= b ? "bg-ink" : "bg-line"}`}
                    style={{ height: `${Math.max(n ? (n / peak) * 100 : 0, 6)}%` }}
                  />
                );
              })}
            </div>
            <div className="relative h-6">
              <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-line" />
              <div className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${pct(a)}%`, right: `${100 - pct(b)}%` }} />
              <input
                type="range"
                aria-label="Minimum price"
                min={LO}
                max={HI}
                step={STEP}
                value={a}
                onChange={(e) => {
                  const v = Math.min(Number(e.target.value), b - STEP);
                  setLo(v <= LO ? 0 : v);
                }}
                className="range-thumb absolute inset-0 h-6 w-full"
              />
              <input
                type="range"
                aria-label="Maximum price"
                min={LO}
                max={HI}
                step={STEP}
                value={b}
                onChange={(e) => {
                  const v = Math.max(Number(e.target.value), a + STEP);
                  setHi(v >= HI ? 0 : v);
                }}
                className="range-thumb absolute inset-0 h-6 w-full"
              />
            </div>

            {/* Min and max */}
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {(
                [
                  ["Minimum", "No min", lo, setLo],
                  ["Maximum", "No max", hi, setHi],
                ] as const
              ).map(([k, ph, v, setV], i) => (
                <div key={k} className={i === 1 ? "col-start-3" : ""}>
                  <label className="block rounded-xl border border-line px-4 py-2 transition-colors duration-300 ease-base focus-within:border-ink hover:border-ink-3">
                    <span className="block caption-3 text-ink-3">{k}</span>
                    <span className="flex items-center gap-1 body-5 text-ink">
                      $
                      <input
                        inputMode="numeric"
                        value={v ? v.toLocaleString("en-US") : ""}
                        placeholder={ph}
                        onChange={(e) => setV(Number(e.target.value.replace(/[^\d]/g, "").slice(0, 6)) || 0)}
                        className="w-full bg-transparent placeholder:text-ink-3 focus:outline-none"
                      />
                    </span>
                  </label>
                </div>
              ))}
              <span className="col-start-2 row-start-1 h-px w-4 bg-ink-3" aria-hidden />
            </div>
            {bad && <p className="mt-2 caption-2 text-error">The minimum is higher than the maximum.</p>}

            {/* Quick ranges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map(([x, y, text]) => {
                const on = lo === x && hi === y;
                return (
                  <button
                    key={text}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setLo(x);
                      setHi(y);
                    }}
                    className={`focus-ring rounded-full border px-4 py-1 caption-4 transition-colors duration-300 ease-base ${
                      on ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink hover:text-ink"
                    }`}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-b-3xl bg-sand px-6 py-4">
            <button
              type="button"
              onClick={() => {
                setLo(0);
                setHi(0);
              }}
              className="focus-ring rounded body-4 text-ink underline underline-offset-4 hover:text-brand"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={bad}
              onClick={() => {
                onApply(lo, hi);
                setOpen(false);
              }}
              className="btn-primary button-sm h-10 px-6!"
            >
              Show {count} {count === 1 ? "home" : "homes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Segment({ id, label, children, first = false }: { id: string; label: string; children: ReactNode; first?: boolean }) {
  return (
    <div
      className={`relative flex min-w-0 flex-col justify-center rounded-2xl px-6 py-2 transition-colors duration-300 ease-base focus-within:bg-sand hover:bg-sand md:rounded-full ${
        first
          ? "col-span-2 md:col-span-1"
          : "md:before:absolute md:before:top-1/4 md:before:left-0 md:before:h-1/2 md:before:w-px md:before:bg-line md:hover:before:opacity-0 md:focus-within:before:opacity-0"
      }`}
    >
      <span id={id} className="caption-3 text-ink">
        {label}
      </span>
      {children}
    </div>
  );
}

function SearchBar({
  f,
  patch,
  filterCount,
  onOpenFilters,
  prices,
  countFor,
}: {
  f: Filters;
  patch: (x: Partial<Filters>) => void;
  filterCount: number;
  onOpenFilters: () => void;
  prices: number[];
  countFor: (min: number, max: number) => number;
}) {
  const [where, setWhere] = useState(f.q);
  return (
    <form
      role="search"
      aria-label="Search homes"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        patch({ q: where.trim() });
      }}
      className="mt-6 grid grid-cols-2 gap-1 rounded-3xl border border-line bg-paper p-2 shadow-lg md:min-h-16 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto] md:items-stretch md:gap-0 md:rounded-full"
    >
      <Segment id="sb-where" label="Where" first>
        <input
          aria-labelledby="sb-where"
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="City or neighborhood"
          autoComplete="address-level2"
          className="w-full min-w-0 bg-transparent body-6 text-ink placeholder:text-ink-3 focus:outline-none"
        />
      </Segment>
      <Segment id="sb-price" label="Price">
        <PricePopover
          key={`${f.min}-${f.max}`}
          labelId="sb-price"
          min={f.min}
          max={f.max}
          prices={prices}
          countFor={countFor}
          onApply={(min, max) => patch({ min, max })}
        />
      </Segment>
      <Segment id="sb-home" label="Home type">
        <Select
          labelId="sb-home"
          variant="inline"
          value={f.kinds.length === 1 ? f.kinds[0] : ""}
          onChange={(v) => patch({ kinds: v ? [v as PropertyKind] : [] })}
          options={[{ value: "", label: f.kinds.length > 1 ? `${f.kinds.length} home types` : "Any type" }, ...KINDS.map(([v, label]) => ({ value: v, label }))]}
        />
      </Segment>
      <Segment id="sb-move" label="Move in">
        <DatePicker labelId="sb-move" variant="inline" value={f.moveIn} onChange={(v) => patch({ moveIn: v })} placeholder="Add date" align="right" />
      </Segment>
      <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:pl-2">
        <button
          type="button"
          onClick={onOpenFilters}
          aria-haspopup="dialog"
          className="focus-ring inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line px-4 button-sm whitespace-nowrap text-ink transition-colors duration-300 ease-base hover:border-ink hover:bg-sand md:flex-none"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden>
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
          Filters
          {filterCount > 0 && <span className="grid size-6 place-items-center rounded-full bg-ink caption-3 text-paper">{filterCount}</span>}
        </button>
        <button
          type="submit"
          aria-label="Search"
          className="focus-ring inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 button-sm text-paper transition-[transform,background-color] duration-300 ease-base hover:bg-brand-hover active:scale-[0.98] md:w-12 md:flex-none md:px-0"
        >
          <SearchIcon className="size-4" strokeWidth={2.25} />
          <span className="md:sr-only">Search</span>
        </button>
      </div>
    </form>
  );
}
