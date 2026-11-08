/** Booking and lease requests from renters. Stored in .data/requests.json. */
import { addMonths, mutate, newId, readRows } from "./store";
import type { ScreeningAnswer } from "./screening";
import type { PaymentTerms } from "./terms";

const FILE = "requests.json";

export type RequestStatus = "sent" | "accepted" | "declined";

export type RentalRequest = {
  id: string;
  userId: string;
  listingId: string;
  title: string;
  city: string;
  type: "monthly" | "yearly";
  moveIn: string;
  months: number;
  message: string;
  /** Answers to the owner's screening questions for this listing. */
  answers?: ScreeningAnswer[];
  createdAt: string;
  status: RequestStatus;
  decidedAt?: string;
  /** Set when accepted, or when the owner adds the customer themselves. */
  terms?: PaymentTerms;
  /** Owner added customers have no account: their details live on the row. */
  source?: "renter" | "owner";
  renterName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  rent?: number;
};

/** The day the stay or lease ends (move out day). */
export const endDate = (r: Pick<RentalRequest, "moveIn" | "months">) => addMonths(r.moveIn, r.months);

const readAll = () => readRows<RentalRequest>(FILE);

export async function addRequest(input: Omit<RentalRequest, "id" | "createdAt" | "status">) {
  const row: RentalRequest = { ...input, id: newId(), createdAt: new Date().toISOString(), status: "sent" };
  await mutate<RentalRequest, void>(FILE, (rows) => {
    rows.push(row);
  });
  return row;
}

export async function requestsFor(userId: string) {
  return (await readAll()).filter((r) => r.userId === userId).reverse();
}

export async function requestsForListings(listingIds: string[]) {
  return (await readAll()).filter((r) => listingIds.includes(r.listingId)).reverse();
}

export async function allRequests() {
  return readAll();
}

export async function findRequest(id: string) {
  return (await readAll()).find((r) => r.id === id) ?? null;
}

/** Two date ranges [a, b) overlap. */
const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 < b2 && b1 < a2;

function clash(rows: RentalRequest[], row: Pick<RentalRequest, "id" | "listingId" | "moveIn" | "months">) {
  const end = endDate(row);
  return rows.find((o) => o.id !== row.id && o.listingId === row.listingId && o.status === "accepted" && overlaps(row.moveIn, end, o.moveIn, endDate(o)));
}
const clashText = (c: RentalRequest) =>
  `Those dates overlap a ${c.type === "yearly" ? "lease" : "furnished stay"} already on this unit (${c.moveIn} to ${endDate(c)}).`;

/** An owner adds a tenant they found themselves. Accepted right away; fails on overlapping dates. */
export async function addOwnerTenancy(input: Omit<RentalRequest, "id" | "createdAt" | "status" | "decidedAt" | "source">) {
  return mutate<RentalRequest, { ok: true; row: RentalRequest } | { ok: false; error: string }>(FILE, (rows) => {
    const row: RentalRequest = { ...input, id: newId(), createdAt: new Date().toISOString(), decidedAt: new Date().toISOString(), status: "accepted", source: "owner" };
    const c = clash(rows, row);
    if (c) return { ok: false, error: clashText(c) };
    rows.push(row);
    return { ok: true, row: { ...row } };
  });
}

/**
 * Accept or decline. Accepting fails when the dates overlap a stay or lease
 * already accepted on the same unit: one calendar, no double bookings.
 */
export async function decideRequest(id: string, decision: "accepted" | "declined", terms?: PaymentTerms) {
  return mutate<RentalRequest, { ok: true; row: RentalRequest } | { ok: false; error: string }>(FILE, (rows) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return { ok: false, error: "We could not find that request." };
    if (row.status !== "sent") return { ok: false, error: "That request was already answered." };
    if (decision === "accepted") {
      const c = clash(rows, row);
      if (c) return { ok: false, error: clashText(c) };
      row.terms = terms;
    }
    row.status = decision;
    row.decidedAt = new Date().toISOString();
    return { ok: true, row: { ...row } };
  });
}
