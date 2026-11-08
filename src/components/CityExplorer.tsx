"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { listings } from "@/lib/listings";
import { STATE_NAMES } from "@/lib/listingDetails";
import { ArrowIcon } from "./icons";

type City = { name: string; state: string; count: number; from: number; img: string };

const cities: City[] = Array.from(
  listings.reduce((map, l) => {
    const [name, state] = l.city.split(",").map((s) => s.trim());
    const c = map.get(l.city) ?? { name, state, count: 0, from: Infinity, img: l.img };
    c.count += 1;
    c.from = Math.min(c.from, l.price);
    return map.set(l.city, c);
  }, new Map<string, City>()),
)
  .map(([, c]) => c)
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const states = Array.from(new Set(cities.map((c) => c.state))).sort((a, b) =>
  (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b),
);

/** Popular cities, filterable by state, each opening the explore page. */
export function CityExplorer() {
  const [state, setState] = useState<string>("all");
  const shown = state === "all" ? cities : cities.filter((c) => c.state === state);

  return (
    <div>
      <div role="tablist" aria-label="States" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {["all", ...states].map((s) => {
          const on = state === s;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setState(s)}
              className={`focus-ring shrink-0 rounded-full px-4 py-2 button-sm transition-colors duration-300 ease-base active:scale-[0.98] ${
                on ? "bg-ink text-paper" : "bg-paper text-ink-2 shadow-sm hover:text-ink"
              }`}
            >
              {s === "all" ? "All states" : STATE_NAMES[s] ?? s}
            </button>
          );
        })}
      </div>

      <ul key={state} role="tabpanel" className="mt-8 grid animate-swap grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {shown.map((c) => (
          <li key={`${c.name}-${c.state}`}>
            <Link href={`/explore?q=${encodeURIComponent(c.name)}`} className="focus-ring group block rounded-2xl">
              <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-line shadow-md">
                <Image
                  src={c.img}
                  alt=""
                  fill
                  sizes="(min-width:768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-base group-hover:scale-[1.04]"
                />
              </span>
              <span className="mt-2 flex items-start justify-between gap-2">
                <span>
                  <span className="block title-3 text-ink group-hover:underline group-hover:underline-offset-4">
                    {c.name}, {c.state}
                  </span>
                  <span className="block caption-5 text-ink-2">
                    {c.count} {c.count === 1 ? "home" : "homes"} from ${c.from.toLocaleString("en-US")} a month
                  </span>
                </span>
                <ArrowIcon className="mt-1 size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-base group-hover:translate-x-1 group-hover:text-ink" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
