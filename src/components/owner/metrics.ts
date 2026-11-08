import type { LedgerEntry, OwnerListing, ReceivedRequest } from "./useOwnerData";
import { monthKey, monthLabel, shiftMonth } from "./ui";

const DAY = 86_400_000;
const t = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const addDays = (iso: string, n: number) => new Date(t(iso) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY);

/** Overlap in days between [a1, a2) and [b1, b2). */
export const overlapDays = (a1: string, a2: string, b1: string, b2: string) =>
  Math.max(0, daysBetween(a1 > b1 ? a1 : b1, a2 < b2 ? a2 : b2));

/** Share of open nights that are booked over the next `days`, across every unit. */
export function occupancy(listings: OwnerListing[], requests: ReceivedRequest[], today: string, days = 90) {
  const end = addDays(today, days);
  let open = 0;
  let booked = 0;
  for (const l of listings) {
    const from = l.availableFrom && l.availableFrom > today ? l.availableFrom : today;
    const until = l.availableUntil && l.availableUntil < end ? l.availableUntil : end;
    const avail = Math.max(0, daysBetween(from, until));
    open += avail;
    const b = requests
      .filter((r) => r.listingId === l.id && r.status === "accepted")
      .reduce((s, r) => s + overlapDays(r.moveIn, r.endDate, from, until), 0);
    booked += Math.min(b, avail);
  }
  return { open, booked, rate: open ? booked / open : 0 };
}

/** Income per month from `from` for `count` months: collected and still scheduled. */
export function incomeByMonth(ledger: LedgerEntry[], from: string, count: number, current: string) {
  return Array.from({ length: count }, (_, i) => {
    const key = shiftMonth(from, i);
    const rows = ledger.filter((e) => e.amount > 0 && monthKey(e.due) === key);
    return {
      key,
      label: monthLabel(key),
      paid: rows.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0),
      scheduled: rows.filter((e) => e.status === "scheduled").reduce((s, e) => s + e.amount, 0),
      current: key === current,
    };
  });
}

export function ledgerTotals(ledger: LedgerEntry[], today: string) {
  const income = ledger.filter((e) => e.amount > 0);
  return {
    collected: income.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0),
    scheduled: income.filter((e) => e.status === "scheduled").reduce((s, e) => s + e.amount, 0),
    overdue: income.filter((e) => e.status === "scheduled" && e.due < today).reduce((s, e) => s + e.amount, 0),
    expenses: -ledger.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0),
  };
}
