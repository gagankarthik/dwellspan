/**
 * Annual net operating income for one unit under three strategies: lease
 * only, furnished stays only, and a blend that fills the gap between leases
 * with furnished stays. Pure functions, safe on the client.
 */

export type YieldInputs = {
  /** Unfurnished lease rent, per month */
  leaseRent: number;
  /** Furnished stay rate, per month */
  furnishedRate: number;
  /** Share of furnished months that are booked, 0 to 100 */
  occupancy: number;
  /** Months a year the blended strategy rents furnished */
  blendMonths: number;
  /** Weeks a year a lease only unit sits empty between tenants */
  vacancyWeeks: number;
  /** One time cost to furnish, spread over FURNITURE_YEARS */
  furnishing: number;
  /** Utilities and wifi the owner pays while furnished, per month */
  utilities: number;
  /** Cleaning per furnished turnover */
  clean: number;
  /** Average furnished stay, in months */
  avgStay: number;
  /** Taxes, insurance, HOA, and upkeep, per month */
  operating: number;
  /** Listing, showings, and screening for a new lease tenant, per year */
  leasing: number;
};

export const FURNITURE_YEARS = 5;
/** Card for furnished stays, ACH for leases. */
export const CARD_FEE = 0.03;
export const ACH_FEE = 0.01;

export const DEFAULT_YIELD: YieldInputs = {
  leaseRent: 2400,
  furnishedRate: 3300,
  occupancy: 85,
  blendMonths: 3,
  vacancyWeeks: 4,
  furnishing: 9000,
  utilities: 220,
  clean: 175,
  avgStay: 3,
  operating: 650,
  leasing: 600,
};

export type YieldLine = { label: string; amount: number };
export type YieldResult = { key: "lease" | "furnished" | "blend"; title: string; gross: number; costs: YieldLine[]; noi: number; occupiedMonths: number };

const sum = (xs: YieldLine[]) => xs.reduce((s, x) => s + x.amount, 0);

export function leaseOnly(i: YieldInputs): YieldResult {
  const vacant = Math.min(i.vacancyWeeks, 52) / 52;
  const gross = i.leaseRent * 12 * (1 - vacant);
  const costs: YieldLine[] = [
    { label: "Operating costs", amount: i.operating * 12 },
    { label: "Leasing a new tenant", amount: i.leasing },
    { label: "Payment processing", amount: gross * ACH_FEE },
  ];
  return { key: "lease", title: "Lease only", gross, costs, noi: gross - sum(costs), occupiedMonths: 12 * (1 - vacant) };
}

export function furnishedOnly(i: YieldInputs): YieldResult {
  const booked = 12 * (i.occupancy / 100);
  const gross = i.furnishedRate * booked;
  const costs: YieldLine[] = [
    { label: "Operating costs", amount: i.operating * 12 },
    { label: "Utilities and wifi", amount: i.utilities * 12 },
    { label: "Turnover cleaning", amount: (booked / Math.max(i.avgStay, 1)) * i.clean },
    { label: `Furniture over ${FURNITURE_YEARS} years`, amount: i.furnishing / FURNITURE_YEARS },
    { label: "Payment processing", amount: gross * CARD_FEE },
  ];
  return { key: "furnished", title: "Furnished only", gross, costs, noi: gross - sum(costs), occupiedMonths: booked };
}

/**
 * Lease for most of the year and rent furnished for the rest. The furnished
 * window sits between leases, so the lease side has no vacancy of its own.
 */
export function blended(i: YieldInputs): YieldResult {
  const m = Math.min(Math.max(i.blendMonths, 0), 12);
  const booked = m * (i.occupancy / 100);
  const furnishedGross = i.furnishedRate * booked;
  const leaseGross = i.leaseRent * (12 - m);
  const gross = furnishedGross + leaseGross;
  const costs: YieldLine[] = [
    { label: "Operating costs", amount: i.operating * 12 },
    { label: "Utilities and wifi", amount: i.utilities * m },
    { label: "Turnover cleaning", amount: (booked / Math.max(i.avgStay, 1)) * i.clean },
    { label: `Furniture over ${FURNITURE_YEARS} years`, amount: m > 0 ? i.furnishing / FURNITURE_YEARS : 0 },
    { label: "Leasing a new tenant", amount: m < 12 ? i.leasing : 0 },
    { label: "Payment processing", amount: furnishedGross * CARD_FEE + leaseGross * ACH_FEE },
  ].filter((x) => x.amount > 0);
  return { key: "blend", title: "Blended", gross, costs, noi: gross - sum(costs), occupiedMonths: booked + (12 - m) };
}

/** Furnished monthly rate at which furnished only earns the same as lease only. */
export function breakEvenRate(i: YieldInputs) {
  const target = leaseOnly(i).noi;
  const booked = 12 * (i.occupancy / 100);
  if (booked <= 0) return null;
  const fixed = i.operating * 12 + i.utilities * 12 + (booked / Math.max(i.avgStay, 1)) * i.clean + i.furnishing / FURNITURE_YEARS;
  return Math.ceil((target + fixed) / (booked * (1 - CARD_FEE)));
}
