"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarIcon, CardIcon, ChevronIcon, HomeIcon, KeyIcon, PlusIcon, SparkleIcon, WrenchIcon } from "../icons";
import { Dialog } from "../Dialog";
import { Select } from "../Select";
import { LegendDot, SWATCH } from "./charts";
import { addDays, daysBetween } from "./metrics";
import { AddPropertyButton, Empty, OwnerReady, Pill, money, monthLabel, pretty, shiftMonth, todayISO } from "./ui";
import { useOwnerData, type ReceivedRequest } from "./useOwnerData";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PENDING = "repeating-linear-gradient(135deg, var(--color-ink-3) 0 2px, var(--color-paper) 2px 5px)";
const MAX_LANES = 3;

type View = "month" | "units";

export function CalendarView() {
  return (
    <OwnerReady>
      <Calendar />
    </OwnerReady>
  );
}

/** Full page owner calendar: a month grid of every stay, lease, and job, or one timeline row per unit. */
function Calendar() {
  const { listings } = useOwnerData();
  const today = todayISO();
  const [view, setView] = useState<View>("month");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [unit, setUnit] = useState("all");
  const step = view === "month" ? 1 : 3;

  if (listings.length === 0)
    return <Empty icon={<CalendarIcon className="size-6" />} title="No units yet" body="Your units' availability, stays, leases, and jobs show here." action={<AddPropertyButton />} />;

  return (
    <div className="flex min-h-[calc(100dvh-112px)] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 heading-3 text-ink">Calendar</h1>
        <button type="button" onClick={() => setMonth(today.slice(0, 7))} className="btn-secondary button-sm h-10">
          Today
        </button>
        <div className="flex">
          <button type="button" aria-label="Previous" onClick={() => setMonth(shiftMonth(month, -step))} className="focus-ring grid size-10 place-items-center rounded-full text-ink-2 hover:bg-paper hover:text-ink">
            <ChevronIcon className="size-5 rotate-90" />
          </button>
          <button type="button" aria-label="Next" onClick={() => setMonth(shiftMonth(month, step))} className="focus-ring grid size-10 place-items-center rounded-full text-ink-2 hover:bg-paper hover:text-ink">
            <ChevronIcon className="size-5 -rotate-90" />
          </button>
        </div>
        <p className="title-1 text-ink" aria-live="polite">
          {view === "month" ? monthLabel(month, true) : `${monthLabel(month, true)} to ${monthLabel(shiftMonth(month, 5), true)}`}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="w-52">
            <Select ariaLabel="Property" size="sm" value={unit} onChange={setUnit} options={[{ value: "all", label: "All properties" }, ...listings.map((l) => ({ value: l.id, label: l.title }))]} />
          </div>
          <div role="tablist" aria-label="Calendar view" className="flex rounded-xl bg-paper p-1 shadow-sm">
            {(
              [
                ["month", "Month"],
                ["units", "Units"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                role="tab"
                type="button"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`focus-ring h-8 rounded-lg px-4 body-5 transition-colors duration-300 ease-base ${view === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <LegendDot fill={SWATCH.paid} label="Furnished stay" />
        <LegendDot fill={SWATCH.lease} label="Lease" />
        <LegendDot fill={PENDING} label="Request waiting" />
        <span className="inline-flex items-center gap-2 caption-4 text-ink-2">
          <WrenchIcon className="size-3" /> Service job
        </span>
        {view === "units" && (
          <span className="inline-flex items-center gap-2 caption-4 text-ink-2">
            <span aria-hidden className="size-3 rounded-[3px] border border-dashed border-brand bg-brand-soft" /> Open for booking
          </span>
        )}
      </div>

      {view === "month" ? <MonthGrid month={month} unit={unit} /> : <Units start={month} unit={unit} />}
    </div>
  );
}

/* ---------------- Month grid ---------------- */

type Bar = { r: ReceivedRequest; start: number; end: number; lane: number; head: boolean; tail: boolean };

function MonthGrid({ month, unit }: { month: string; unit: string }) {
  const { listings, requests, tickets, ledger } = useOwnerData();
  const today = todayISO();
  const [day, setDay] = useState<string | null>(null);

  const first = `${month}-01`;
  const lead = new Date(`${first}T00:00:00`).getDay();
  const gridStart = addDays(first, -lead);
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)));
  const inUnit = <T extends { listingId: string }>(x: T) => unit === "all" || x.listingId === unit;
  const stays = requests.filter((r) => r.status !== "declined" && inUnit(r));
  const jobs = tickets.filter((t) => t.date && t.status !== "declined" && inUnit(t));
  const unitName = (id: string) => listings.find((l) => l.id === id)?.title ?? "";

  // Lay each week's stays into lanes so overlapping bars stack instead of colliding.
  function barsFor(week: string[]): { bars: Bar[]; hidden: number[] } {
    const ws = week[0];
    const we = addDays(week[6], 1);
    const hits = stays
      .filter((r) => r.moveIn < we && r.endDate > ws)
      .sort((a, b) => a.moveIn.localeCompare(b.moveIn) || daysBetween(b.moveIn, b.endDate) - daysBetween(a.moveIn, a.endDate));
    const lanes: number[] = [];
    const bars: Bar[] = [];
    const hidden = Array(7).fill(0);
    for (const r of hits) {
      const start = Math.max(0, daysBetween(ws, r.moveIn));
      const end = Math.min(6, daysBetween(ws, r.endDate) - 1);
      let lane = lanes.findIndex((free) => free < start);
      if (lane < 0) lane = lanes.length;
      lanes[lane] = end;
      if (lane >= MAX_LANES) {
        for (let i = start; i <= end; i++) hidden[i]++;
        continue;
      }
      bars.push({ r, start, end, lane, head: r.moveIn >= ws, tail: r.endDate <= we });
    }
    return { bars, hidden };
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((d) => (
            <span key={d} className="px-2 py-2 text-center caption-4 text-ink-2">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </span>
          ))}
        </div>
        <div className="grid flex-1 grid-rows-6">
          {weeks.map((week) => {
            const { bars, hidden } = barsFor(week);
            return (
              <div key={week[0]} className="relative grid min-h-28 grid-cols-7 border-b border-line last:border-b-0">
                {week.map((d, i) => {
                  const out = d.slice(0, 7) !== month;
                  const dayJobs = jobs.filter((t) => t.date === d);
                  const isToday = d === today;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDay(d)}
                      aria-label={`${pretty(d)}${dayJobs.length ? `, ${dayJobs.length} ${dayJobs.length === 1 ? "job" : "jobs"}` : ""}. Open day`}
                      className={`focus-ring flex flex-col items-stretch border-r border-line p-1 text-left transition-colors duration-300 ease-base last:border-r-0 hover:bg-sand/70 ${out ? "bg-sand/50" : ""}`}
                    >
                      <span className={`grid size-7 place-items-center self-end rounded-full caption-3 ${isToday ? "bg-brand text-paper" : out ? "text-ink-3" : "text-ink"}`}>{+d.slice(8)}</span>
                      {/* Room for the stay bars, which sit on top of the row. */}
                      <span aria-hidden style={{ height: `${Math.min(MAX_LANES, Math.max(...bars.map((b) => b.lane + 1), 0)) * 24}px` }} />
                      <span className="mt-1 flex flex-col gap-0.5">
                        {hidden[i] > 0 && <span className="truncate px-1 caption-5 text-ink-2">+{hidden[i]} more</span>}
                        {dayJobs.slice(0, 2).map((t) => (
                          <span key={t.id} className="flex items-center gap-1 truncate rounded px-1 caption-5 text-ink">
                            {t.category === "cleaning" ? <SparkleIcon className="size-3 shrink-0 text-ink-2" /> : <WrenchIcon className="size-3 shrink-0 text-ink-2" />}
                            <span className="truncate">{t.title}</span>
                          </span>
                        ))}
                        {dayJobs.length > 2 && <span className="px-1 caption-5 text-ink-2">+{dayJobs.length - 2} jobs</span>}
                      </span>
                    </button>
                  );
                })}
                {bars.map((b) => {
                  const pending = b.r.status === "sent";
                  const lease = b.r.type === "yearly";
                  return (
                    <button
                      key={`${b.r.id}-${week[0]}`}
                      type="button"
                      onClick={() => setDay(week[b.start])}
                      title={`${b.r.renter}, ${pretty(b.r.moveIn)} to ${pretty(b.r.endDate)}${pending ? " (waiting for you)" : ""}`}
                      className={`focus-ring absolute flex h-5 items-center overflow-hidden px-2 caption-3 ${pending ? "border border-ink-3 text-ink" : lease ? "text-ink" : "text-paper"} ${b.head ? "rounded-l-md" : ""} ${b.tail ? "rounded-r-md" : ""}`}
                      style={{
                        top: `${36 + b.lane * 24}px`,
                        left: `calc(${(b.start / 7) * 100}% + ${b.head ? 4 : 0}px)`,
                        width: `calc(${((b.end - b.start + 1) / 7) * 100}% - ${(b.head ? 4 : 0) + (b.tail ? 4 : 0)}px)`,
                        background: pending ? PENDING : lease ? SWATCH.lease : SWATCH.paid,
                      }}
                    >
                      <span className={`truncate ${pending ? "rounded bg-paper px-1" : ""}`}>
                        {b.head && <KeyIcon className="mr-1 inline size-3" />}
                        {b.r.renter}
                        {unit === "all" ? ` · ${unitName(b.r.listingId)}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <DayDialog day={day} unit={unit} onClose={() => setDay(null)} stays={stays} jobs={jobs} ledger={ledger.filter((e) => e.amount > 0 && inUnit(e))} />
    </>
  );
}

function DayDialog({
  day,
  unit,
  onClose,
  stays,
  jobs,
  ledger,
}: {
  day: string | null;
  unit: string;
  onClose: () => void;
  stays: ReceivedRequest[];
  jobs: ReturnType<typeof useOwnerData>["tickets"];
  ledger: ReturnType<typeof useOwnerData>["ledger"];
}) {
  const { listings } = useOwnerData();
  if (!day) return <Dialog open={false} onClose={onClose} title="" bare />;
  const rows: { Icon: (p: { className?: string }) => ReactNode; title: string; meta: string; tag?: ReactNode }[] = [];
  for (const r of stays.filter((s) => s.moveIn <= day && s.endDate >= day)) {
    const kind = r.type === "yearly" ? "Lease" : "Furnished stay";
    const what = r.moveIn === day ? "moves in" : r.endDate === day ? "moves out" : "staying";
    rows.push({
      Icon: r.moveIn === day ? KeyIcon : HomeIcon,
      title: `${r.renter} ${what}`,
      meta: `${r.title} · ${kind}, ${pretty(r.moveIn, false)} to ${pretty(r.endDate, false)}`,
      tag: r.status === "sent" ? <Pill tone="warn">Waiting for you</Pill> : undefined,
    });
  }
  for (const t of jobs.filter((x) => x.date === day))
    rows.push({ Icon: t.category === "cleaning" ? SparkleIcon : WrenchIcon, title: t.title, meta: `${t.listingTitle} · ${t.vendorName ?? "No vendor yet"}${t.window ? `, ${t.window.replace("-", " to ")}` : ""}` });
  for (const e of ledger.filter((x) => x.due === day))
    rows.push({ Icon: CardIcon, title: `${money(e.amount)} ${e.label.toLowerCase()}`, meta: `${e.renterName ?? ""} · ${e.listingTitle}`, tag: e.status === "paid" ? <Pill tone="good">Received</Pill> : <Pill tone="brand">Scheduled</Pill> });

  const free = listings.filter((l) => (unit === "all" || l.id === unit) && !stays.some((s) => s.listingId === l.id && s.status === "accepted" && s.moveIn <= day && s.endDate > day));
  return (
    <Dialog
      open
      onClose={onClose}
      title={new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      description={free.length ? `${free.length} ${free.length === 1 ? "unit is" : "units are"} open this night.` : "Every unit is booked this night."}
      bare
    >
      {rows.length === 0 ? (
        <p className="body-6 text-ink-2">Nothing on this day.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <r.Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate body-5 text-ink">{r.title}</span>
                <span className="block truncate caption-5 text-ink-2">{r.meta}</span>
              </span>
              {r.tag}
            </li>
          ))}
        </ul>
      )}
      <Link href={`/dashboard/service?new=1${unit !== "all" ? `&unit=${unit}` : ""}`} className="focus-ring inline-flex items-center gap-1 self-start rounded caption-3 text-brand hover:underline">
        <PlusIcon className="size-3" strokeWidth={2.5} /> New service request
      </Link>
    </Dialog>
  );
}

/* ---------------- Units timeline ---------------- */

const SPAN = 6;

function Units({ start, unit }: { start: string; unit: string }) {
  const { listings, requests, tickets } = useOwnerData();
  const today = todayISO();
  const from = `${start}-01`;
  const to = `${shiftMonth(start, SPAN)}-01`;
  const total = daysBetween(from, to);
  const pos = (iso: string) => Math.max(0, Math.min(100, (daysBetween(from, iso) / total) * 100));
  const bar = (a: string, b: string) => ({ left: `${pos(a)}%`, width: `${Math.max(pos(b) - pos(a), 0.6)}%` });
  const visible = (a: string, b: string) => a < to && b > from;
  const months = Array.from({ length: SPAN }, (_, i) => shiftMonth(start, i));
  const todayIn = today >= from && today < to;
  const shown = listings.filter((l) => unit === "all" || l.id === unit);

  return (
    <section aria-label="Unit timeline" className="flex-1 overflow-x-auto rounded-2xl border border-line/70 bg-paper p-6 shadow-sm">
      <div className="min-w-[760px]">
        <div className="ml-56 grid border-b border-line pb-2" style={{ gridTemplateColumns: `repeat(${SPAN}, 1fr)` }}>
          {months.map((m) => (
            <span key={m} className="caption-4 text-ink-2">
              {monthLabel(m)}
            </span>
          ))}
        </div>
        <ul>
          {shown.map((l) => {
            const mine = requests.filter((r) => r.listingId === l.id && r.status !== "declined" && visible(r.moveIn, r.endDate));
            const jobs = tickets.filter((t) => t.listingId === l.id && t.date && t.status !== "declined" && t.date >= from && t.date < to);
            const aFrom = l.availableFrom ?? l.createdAt.slice(0, 10);
            const aTo = l.availableUntil ?? addDays(to, 1);
            return (
              <li key={l.id} id={`unit-${l.id}`} className="flex scroll-mt-24 items-center border-b border-line py-4 last:border-b-0">
                <div className="w-56 shrink-0 pr-4">
                  <p className="truncate title-4 text-ink">{l.title}</p>
                  <p className="truncate caption-5 text-ink-2">
                    {l.city} · {l.type === "yearly" ? "Lease" : "Furnished"}
                  </p>
                </div>
                <div className="relative h-16 flex-1">
                  <div aria-hidden className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${SPAN}, 1fr)` }}>
                    {months.map((m) => (
                      <span key={m} className="border-l border-line/70" />
                    ))}
                  </div>
                  {visible(aFrom, aTo) && <span className="absolute inset-y-3 rounded-md border border-dashed border-brand bg-brand-soft" style={bar(aFrom, aTo)} title={`Open ${pretty(aFrom)} to ${l.availableUntil ? pretty(aTo) : "ongoing"}`} />}
                  {mine.map((r) => {
                    const pending = r.status === "sent";
                    return (
                      <span
                        key={r.id}
                        className={`absolute inset-y-5 flex items-center overflow-hidden rounded-[4px] px-2 caption-3 ${pending ? "border border-ink-3 text-ink" : r.type === "yearly" ? "text-ink" : "text-paper"}`}
                        style={{ ...bar(r.moveIn, r.endDate), background: pending ? PENDING : r.type === "yearly" ? SWATCH.lease : SWATCH.paid }}
                        title={`${r.renter}: ${pretty(r.moveIn)} to ${pretty(r.endDate)}${pending ? " (waiting)" : ""}`}
                      >
                        <span className={`truncate ${pending ? "rounded bg-paper px-1" : ""}`}>{r.renter}</span>
                      </span>
                    );
                  })}
                  {jobs.map((t) => (
                    <span key={t.id} className="absolute bottom-0 size-3 -translate-x-1/2 rounded-full border-2 border-paper bg-ink" style={{ left: `${pos(t.date!)}%` }} title={`${t.title} on ${pretty(t.date!)}`} />
                  ))}
                  {todayIn && <span aria-hidden className="absolute -inset-y-2 w-0.5 bg-error" style={{ left: `${pos(today)}%` }} />}
                </div>
              </li>
            );
          })}
        </ul>
        {todayIn && <p className="mt-2 caption-5 text-ink-2">The red line marks today. Dots are service jobs.</p>}
      </div>
    </section>
  );
}
