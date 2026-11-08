"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { WarningIcon } from "@phosphor-icons/react";
import { heroImages } from "@/lib/listings";
import { SearchIcon } from "./icons";
import { DatePicker } from "./DatePicker";
import { Select } from "./Select";

export const LENGTH_OPTIONS = [
  { value: "0", label: "Any length" },
  ...Array.from({ length: 11 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} ${i ? "months" : "month"}`,
    note: i === 0 ? "Furnished, move in ready" : undefined,
  })),
  { value: "12", label: "12 months or more", note: "Long term lease" },
];

export function SearchField({
  label,
  htmlFor,
  children,
  divider = false,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      className={`relative flex min-w-0 flex-col justify-center rounded-xl px-6 py-2 transition-colors duration-300 ease-base focus-within:bg-sand hover:bg-sand ${
        divider
          ? "md:before:absolute md:before:top-1/4 md:before:left-0 md:before:h-1/2 md:before:w-px md:before:bg-line md:hover:before:opacity-0 md:focus-within:before:opacity-0"
          : ""
      }`}
    >
      <label id={`${htmlFor}-label`} htmlFor={htmlFor} className="caption-3 text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

export const searchInputCls = "w-full min-w-0 bg-transparent body-6 text-ink-2 placeholder:text-ink-3 focus:outline-none";

export function HeroSearch() {
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [months, setMonths] = useState("0");
  const [dateError, setDateError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (moveIn) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(`${moveIn}T00:00:00`) < today) {
        setDateError("That date has passed. Pick a move in date from today onward.");
        return;
      }
    }
    const p = new URLSearchParams();
    if (where.trim()) p.set("q", where.trim());
    if (moveIn) p.set("moveIn", moveIn);
    if (months !== "0") p.set("months", months);
    router.push(`/explore${p.size ? `?${p}` : ""}`);
  }

  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate">
      <Image src={heroImages.main.src} alt={heroImages.main.alt} fill priority quality={85} sizes="100vw" className="-z-10 object-cover object-[50%_60%]" />
      {/* Light tinted overlay keeps the photo crisp; a soft shadow lifts the type off bright areas */}
      <div className="absolute inset-0 -z-10 bg-[rgb(12_18_40/0.42)]" aria-hidden />

      <div className="mx-auto flex min-h-[640px] w-full max-w-6xl flex-col items-center justify-center px-4 pt-16 pb-16 text-center sm:px-6 md:min-h-[720px]">
        <h1 id="hero-title" className="max-w-[680px] heading-1 text-paper [text-shadow:0_2px_4px_rgb(12_18_40/0.45)]">
          Homes for a month, a season,
          <br className="hidden sm:block" /> or the year ahead
        </h1>
        <p className="mt-4 max-w-[60ch] lead font-medium text-paper [text-shadow:0_1px_2px_rgb(12_18_40/0.6)]">
          Move in ready furnished stays and long term leases, side by side in one search.
        </p>

        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Search homes"
          className="mt-8 grid w-full max-w-3xl gap-2 rounded-2xl border border-line bg-paper p-2 text-left shadow-2xl md:min-h-16 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-stretch md:gap-0"
        >
          <SearchField label="Where" htmlFor="s-where">
            <input
              id="s-where"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="City or neighborhood"
              autoComplete="address-level2"
              className={searchInputCls}
            />
          </SearchField>
          <div className="grid grid-cols-2 gap-2 md:contents">
            <SearchField label="Move in" htmlFor="s-move" divider>
              <DatePicker
                id="s-move"
                labelId="s-move-label"
                variant="inline"
                value={moveIn}
                onChange={(v) => {
                  setMoveIn(v);
                  setDateError("");
                }}
                invalid={Boolean(dateError)}
                describedBy={dateError ? "s-move-error" : undefined}
              />
            </SearchField>
            <SearchField label="Stay length" htmlFor="s-months" divider>
              <Select id="s-months" labelId="s-months-label" variant="inline" value={months} onChange={setMonths} options={LENGTH_OPTIONS} />
            </SearchField>
          </div>
          <button type="submit" className="btn-primary button-md min-h-12 rounded-xl! md:ml-2 md:px-6!">
            <SearchIcon className="size-4" strokeWidth={2.25} />
            Search
          </button>
          {dateError && (
            <p id="s-move-error" role="alert" className="flex items-center gap-2 px-4 pb-2 caption-2 text-error md:col-span-4">
              <WarningIcon aria-hidden className="size-4 shrink-0" /> {dateError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
