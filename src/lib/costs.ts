/**
 * The honest math behind every price on Dwellspan. Safe to import on the client.
 *
 * A furnished stay that includes utilities and a bare lease are not comparable
 * on rent alone. Everything here turns a listing into a true monthly cost:
 * rent, recurring fees, the utilities the renter would still pay, and one time
 * fees spread across the stay. Estimates are labelled as estimates wherever
 * they are shown.
 */
import type { Fee, Listing } from "./listings";

export type UtilityKey = "electricity" | "water" | "gas" | "heat" | "internet" | "trash";

/** Typical monthly cost for an 800 sqft home in an average US city. */
const UTILITY_BASE: Record<UtilityKey, number> = {
  electricity: 95,
  water: 45,
  gas: 35,
  heat: 30,
  internet: 65,
  trash: 20,
};
/** Which utilities scale with the size of the home. */
const SCALES_WITH_SIZE: UtilityKey[] = ["electricity", "gas", "heat", "water"];
export const UTILITY_KEYS = Object.keys(UTILITY_BASE) as UtilityKey[];

/** Rough regional multipliers: climate, rates, and provider pricing. */
const CITY_FACTOR: Record<string, number> = {
  "Austin, TX": 1.15,
  "Seattle, WA": 0.95,
  "Portland, OR": 0.95,
  "Denver, CO": 0.95,
  "Chicago, IL": 1.05,
  "Raleigh, NC": 1.0,
  "Durham, NC": 1.0,
  "Nashville, TN": 1.05,
};

const sizeFactor = (sqft: number) => Math.min(Math.max((sqft || 800) / 800, 0.6), 2.5);

/** Utilities the rent already covers. Owner listings say so; sample homes are read from their tags. */
export function includedUtilities(l: Pick<Listing, "tags" | "type" | "utilitiesIncluded">): UtilityKey[] {
  if (l.utilitiesIncluded?.length) return l.utilitiesIncluded.filter((k): k is UtilityKey => k in UTILITY_BASE);
  if (l.tags.includes("utilities")) return [...UTILITY_KEYS];
  // Furnished stays on Dwellspan always come with working wifi.
  if (l.type === "monthly") return ["internet"];
  return [];
}

/** Estimated monthly cost of each utility the renter would pay on top of rent. */
export function utilityEstimate(l: Pick<Listing, "tags" | "type" | "utilitiesIncluded" | "sqft" | "city">) {
  const covered = new Set(includedUtilities(l));
  const city = CITY_FACTOR[l.city] ?? 1;
  const size = sizeFactor(l.sqft);
  const lines = UTILITY_KEYS.filter((k) => !covered.has(k)).map((k) => ({
    key: k,
    amount: Math.round(UTILITY_BASE[k] * city * (SCALES_WITH_SIZE.includes(k) ? size : 1)),
  }));
  return { lines, total: lines.reduce((s, x) => s + x.amount, 0), covered: [...covered] };
}

export type CostLine = { label: string; amount: number; estimate?: boolean; note?: string };

export type MonthlyCost = {
  rent: number;
  fees: number;
  utilities: number;
  oneTimeSpread: number;
  total: number;
  /** True when part of the total is our estimate rather than the owner's number. */
  estimated: boolean;
  allUtilitiesIncluded: boolean;
  lines: CostLine[];
};

const isUtilityFee = (f: Fee) => /utilit/i.test(f.name);
/** Fees every renter pays. Pet rent only applies to renters with pets, so it stays out of the headline number. */
export const applies = (fees: Fee[] = []) => fees.filter((f) => !/pet/i.test(f.name));
const oneTimeTotal = (fees?: Fee[]) =>
  applies(fees)
    .filter((f) => f.frequency === "once" && !/application/i.test(f.name))
    .reduce((s, f) => s + f.amount, 0);

/**
 * True monthly cost of living in a home for `months` months.
 * One time fees are spread across the stay so a $300 cleaning fee on a
 * 3 month stay reads as $100 a month.
 */
export function monthlyCost(l: Listing & { fees?: Fee[] }, months = l.type === "yearly" ? 12 : Math.max(l.minMonths, 3)): MonthlyCost {
  const n = Math.max(1, months);
  const fees = applies(l.fees);
  const monthlyFees = fees.filter((f) => f.frequency === "monthly");
  const oneTime = fees.filter((f) => f.frequency === "once" && !/application/i.test(f.name));
  // An owner who charges a flat utilities fee has priced utilities already.
  const flatUtilities = monthlyFees.some(isUtilityFee);
  const util = flatUtilities ? { lines: [], total: 0, covered: UTILITY_KEYS } : utilityEstimate(l);

  const lines: CostLine[] = [{ label: "Rent", amount: l.price }];
  for (const f of monthlyFees) lines.push({ label: f.name, amount: f.amount });
  if (util.total) lines.push({ label: "Utilities you pay", amount: util.total, estimate: true, note: util.lines.map((x) => x.key).join(", ") });
  const spread = Math.round(oneTime.reduce((s, f) => s + f.amount, 0) / n);
  if (spread) lines.push({ label: `One time fees over ${n} ${n === 1 ? "month" : "months"}`, amount: spread });

  const feeTotal = monthlyFees.reduce((s, f) => s + f.amount, 0);
  return {
    rent: l.price,
    fees: feeTotal,
    utilities: util.total,
    oneTimeSpread: spread,
    total: l.price + feeTotal + util.total + spread,
    estimated: util.total > 0,
    allUtilitiesIncluded: util.total === 0,
    lines,
  };
}

/* ---------------- Furnished stay vs lease ---------------- */

/** What it costs to furnish an empty home well enough to live in. */
export function furnishingCost(beds: number) {
  return beds <= 0 ? 3000 : 3500 + beds * 1500;
}
/** Share of furniture spend you get back if you sell it when you leave. */
export const RESALE_SHARE = 0.35;
/** A typical early termination fee, in months of rent. */
export const BREAK_FEE_MONTHS = 2;
/** One time setup: utility deposits and activation fees. */
export const UTILITY_SETUP = 150;

export type PlanLine = { label: string; amount: number; estimate?: boolean };
export type Plan = {
  key: "furnished" | "lease" | "bridge";
  title: string;
  months: number;
  total: number;
  perMonth: number;
  lines: PlanLine[];
  /** Refundable deposits, shown apart from the cost. */
  deposits: number;
  note?: string;
  available: boolean;
};

type Home = Listing & { fees?: Fee[]; deposit?: number };

/** Cost of a furnished stay for exactly `months`. */
export function furnishedPlan(h: Home, months: number): Plan {
  const n = Math.max(months, h.minMonths);
  const m = monthlyCost(h, n);
  const recurring = (m.rent + m.fees + m.utilities) * n;
  const oneTime = oneTimeTotal(h.fees);
  const lines: PlanLine[] = [
    { label: `Rent, ${n} ${n === 1 ? "month" : "months"}`, amount: m.rent * n },
    ...(m.fees ? [{ label: "Monthly fees", amount: m.fees * n }] : []),
    ...(m.utilities ? [{ label: "Utilities you pay", amount: m.utilities * n, estimate: true }] : []),
    ...(oneTime ? [{ label: "One time fees", amount: oneTime }] : []),
  ];
  const total = recurring + oneTime;
  return {
    key: "furnished",
    title: "Furnished stay",
    months: n,
    total,
    perMonth: Math.round(total / months),
    lines,
    deposits: h.deposit ?? 0,
    note: n > months ? `This home has a ${h.minMonths} month minimum, so you pay for ${n}.` : undefined,
    available: true,
  };
}

/**
 * Cost of living in an unfurnished lease for `months`. If you leave before the
 * term ends you pay the cheaper of the remaining rent or a break fee.
 * `keepFurniture` drops the resale credit: you are buying furniture you keep.
 */
export function leasePlan(h: Home, months: number, keepFurniture = false): Plan {
  const terms = (h.leaseTerms?.length ? h.leaseTerms : [12]).slice().sort((a, b) => a - b);
  const term = terms.find((t) => t >= months) ?? terms[terms.length - 1];
  const m = monthlyCost(h, term);
  const lived = months;
  const short = Math.max(term - lived, 0);
  const exit = short ? Math.min(short * m.rent, BREAK_FEE_MONTHS * m.rent) : 0;
  const furnished = h.tags.includes("furnished");
  const furniture = furnished ? 0 : furnishingCost(h.beds);
  const resale = furnished || keepFurniture ? 0 : Math.round(furniture * RESALE_SHARE);
  const oneTime = oneTimeTotal(h.fees);
  const lines: PlanLine[] = [
    { label: `Rent, ${lived} ${lived === 1 ? "month" : "months"}`, amount: m.rent * lived },
    ...(m.fees ? [{ label: "Monthly fees", amount: m.fees * lived }] : []),
    ...(m.utilities ? [{ label: "Utilities you pay", amount: m.utilities * lived, estimate: true }] : []),
    ...(m.utilities ? [{ label: "Utility setup and deposits", amount: UTILITY_SETUP, estimate: true }] : []),
    ...(oneTime ? [{ label: "One time fees", amount: oneTime }] : []),
    ...(furniture ? [{ label: "Furniture and basics", amount: furniture, estimate: true }] : []),
    ...(resale ? [{ label: "Furniture resold when you leave", amount: -resale, estimate: true }] : []),
    ...(exit ? [{ label: short * m.rent <= BREAK_FEE_MONTHS * m.rent ? `Rent for the ${short} months you are gone` : `Break fee, ${BREAK_FEE_MONTHS} months of rent`, amount: exit }] : []),
  ];
  const total = lines.reduce((s, x) => s + x.amount, 0);
  return {
    key: "lease",
    title: "Long term lease",
    months: lived,
    total,
    perMonth: Math.round(total / lived),
    lines,
    deposits: h.deposit ?? 0,
    note: short ? `Shortest lease offered is ${term} months; you leave ${short} ${short === 1 ? "month" : "months"} early.` : undefined,
    available: true,
  };
}

/**
 * The Dwellspan path: land in a furnished stay, then move into a lease once
 * you know the city. `first` months furnished, the rest on the lease.
 */
export function bridgePlan(stay: Home, lease: Home, months: number, first: number, keepFurniture = false): Plan {
  const f = Math.max(first, stay.minMonths);
  if (months <= f)
    return { key: "bridge", title: "Furnished first, then lease", months, total: 0, perMonth: 0, lines: [], deposits: 0, available: false, note: `Needs more than ${f} months to switch.` };
  const a = furnishedPlan(stay, f);
  const b = leasePlan(lease, months - f, keepFurniture);
  const lines: PlanLine[] = [
    { label: `Furnished stay, ${f} months`, amount: a.total },
    ...b.lines.map((x) => ({ ...x, label: `Lease: ${x.label.charAt(0).toLowerCase()}${x.label.slice(1)}` })),
  ];
  const total = a.total + b.total;
  return {
    key: "bridge",
    title: "Furnished first, then lease",
    months,
    total,
    perMonth: Math.round(total / months),
    lines,
    deposits: Math.max(a.deposits, b.deposits),
    note: `Same Renter Passport for both applications, so no second screening fee.`,
    available: true,
  };
}

/** First stay length, from 1 to `max`, where the lease costs less than the furnished stay. */
export function crossover(stay: Home, lease: Home, keepFurniture = false, max = 24) {
  for (let n = 1; n <= max; n++) if (leasePlan(lease, n, keepFurniture).total < furnishedPlan(stay, n).total) return n;
  return null;
}
