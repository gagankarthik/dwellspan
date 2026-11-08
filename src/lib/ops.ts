/**
 * Owner operations: vendors, service tickets (cleaning and repairs), the
 * ledger, and renter ratings. Stored as JSON under .data/.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Fee } from "./listings";
import { endDate, type RentalRequest } from "./requests";
import { DATA_DIR, addMonths, mutate, newId, readRows, todayISO } from "./store";
import { FREQUENCY_MONTHS, defaultTerms, type Method, type PaymentTerms } from "./terms";

const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/* ---------------- Vendors ---------------- */

export const TRADES = ["cleaning", "handyman", "plumbing", "electrical", "hvac", "appliance", "pest", "landscaping", "locksmith", "other"] as const;
export type Trade = (typeof TRADES)[number];

export type Vendor = {
  id: string;
  ownerId: string;
  name: string;
  trade: Trade;
  phone: string;
  email: string;
  /** Move out cleans go to this vendor automatically. */
  defaultCleaner: boolean;
  createdAt: string;
};

const VENDORS = "vendors.json";

export async function vendorsFor(ownerId: string) {
  return (await readRows<Vendor>(VENDORS)).filter((v) => v.ownerId === ownerId);
}

export async function addVendor(ownerId: string, input: Pick<Vendor, "name" | "trade" | "phone" | "email" | "defaultCleaner">) {
  return mutate<Vendor, Vendor>(VENDORS, (rows) => {
    const mine = rows.filter((v) => v.ownerId === ownerId);
    // The first cleaner becomes the default; a new default replaces the old one.
    const makeDefault = input.trade === "cleaning" && (input.defaultCleaner || !mine.some((v) => v.defaultCleaner));
    if (makeDefault) mine.forEach((v) => (v.defaultCleaner = false));
    const row: Vendor = { ...input, defaultCleaner: makeDefault, id: newId(), ownerId, createdAt: new Date().toISOString() };
    rows.push(row);
    return row;
  });
}

export async function setDefaultCleaner(ownerId: string, id: string) {
  return mutate<Vendor, boolean>(VENDORS, (rows) => {
    const target = rows.find((v) => v.id === id && v.ownerId === ownerId && v.trade === "cleaning");
    if (!target) return false;
    rows.filter((v) => v.ownerId === ownerId).forEach((v) => (v.defaultCleaner = v.id === id));
    return true;
  });
}

export async function removeVendor(ownerId: string, id: string) {
  return mutate<Vendor, boolean>(VENDORS, (rows) => {
    const i = rows.findIndex((v) => v.id === id && v.ownerId === ownerId);
    if (i < 0) return false;
    rows.splice(i, 1);
    return true;
  });
}

/* ---------------- Service tickets ---------------- */

export const CATEGORIES = [
  "cleaning",
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "pest",
  "locks",
  "landscaping",
  "general",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type Priority = "low" | "normal" | "urgent";
export type TicketStatus = "pending" | "approved" | "scheduled" | "completed" | "declined";

export type Ticket = {
  id: string;
  ownerId: string;
  listingId: string;
  listingTitle: string;
  category: Category;
  priority: Priority;
  title: string;
  details: string;
  photos: { file: string; type: string }[];
  reportedBy: "owner" | "tenant" | "system";
  reporterId?: string;
  reporterName?: string;
  requestId?: string;
  source: "manual" | "move-out";
  status: TicketStatus;
  vendorId?: string;
  vendorName?: string;
  /** YYYY-MM-DD */
  date?: string;
  /** "09:00-12:00" */
  window?: string;
  accessCode?: string;
  cost?: number;
  history: { at: string; text: string }[];
  createdAt: string;
  updatedAt: string;
};

const TICKETS = "tickets.json";
export const TICKET_UPLOADS = path.join(DATA_DIR, "ticket-uploads");

export async function ticketsForOwner(ownerId: string) {
  return (await readRows<Ticket>(TICKETS)).filter((t) => t.ownerId === ownerId).reverse();
}
export async function ticketsForReporter(userId: string) {
  return (await readRows<Ticket>(TICKETS)).filter((t) => t.reporterId === userId).reverse();
}
export async function findTicket(id: string) {
  return (await readRows<Ticket>(TICKETS)).find((t) => t.id === id) ?? null;
}

export async function createTicket(
  input: Omit<Ticket, "id" | "photos" | "history" | "createdAt" | "updatedAt">,
  photos: { bytes: Buffer; ext: string; mime: string }[] = [],
  note = "Ticket opened",
) {
  const id = newId();
  await fs.mkdir(TICKET_UPLOADS, { recursive: true });
  const saved = await Promise.all(
    photos.map(async (p, i) => {
      const file = `${id}-${i}.${p.ext}`;
      await fs.writeFile(path.join(TICKET_UPLOADS, file), p.bytes);
      return { file, type: p.mime };
    }),
  );
  const now = new Date().toISOString();
  const row: Ticket = { ...input, id, photos: saved, history: [{ at: now, text: note }], createdAt: now, updatedAt: now };
  await mutate<Ticket, void>(TICKETS, (rows) => {
    rows.push(row);
  });
  return row;
}

export type TicketAction =
  | { action: "approve" }
  | { action: "decline" }
  | { action: "schedule"; vendorId: string; date: string; window: string; accessCode?: string }
  | { action: "complete"; cost?: number }
  | { action: "reopen" };

export async function updateTicket(ownerId: string, id: string, act: TicketAction) {
  const vendors = await vendorsFor(ownerId);
  return mutate<Ticket, { ok: true; row: Ticket } | { ok: false; error: string }>(TICKETS, (rows) => {
    const t = rows.find((r) => r.id === id && r.ownerId === ownerId);
    if (!t) return { ok: false, error: "We could not find that ticket." };
    const now = new Date().toISOString();
    const log = (text: string) => t.history.push({ at: now, text });
    switch (act.action) {
      case "approve":
        if (t.status !== "pending") return { ok: false, error: "Only pending tickets can be approved." };
        t.status = "approved";
        log("Approved by owner");
        break;
      case "decline":
        if (t.status === "completed") return { ok: false, error: "That ticket is already complete." };
        t.status = "declined";
        log("Declined by owner");
        break;
      case "schedule": {
        if (t.status === "completed" || t.status === "declined") return { ok: false, error: "Reopen the ticket before booking it." };
        const v = vendors.find((x) => x.id === act.vendorId);
        if (!v) return { ok: false, error: "Pick a vendor from your team." };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(act.date)) return { ok: false, error: "Pick a date." };
        if (act.date < todayISO()) return { ok: false, error: "That date has passed." };
        t.status = "scheduled";
        t.vendorId = v.id;
        t.vendorName = v.name;
        t.date = act.date;
        t.window = act.window;
        if (act.accessCode !== undefined) t.accessCode = act.accessCode.slice(0, 40);
        log(`Booked with ${v.name} on ${act.date}, ${act.window}`);
        break;
      }
      case "complete":
        if (t.status === "declined") return { ok: false, error: "Reopen the ticket first." };
        t.status = "completed";
        if (act.cost && act.cost > 0) t.cost = Math.round(act.cost * 100) / 100;
        log(t.cost ? `Marked done, cost $${t.cost}` : "Marked done");
        break;
      case "reopen":
        t.status = t.vendorId && t.date ? "scheduled" : "approved";
        log("Reopened");
        break;
    }
    t.updatedAt = now;
    return { ok: true, row: { ...t } };
  });
}

/* ---------------- Ledger ---------------- */

export type LedgerEntry = {
  id: string;
  ownerId: string;
  listingId: string;
  listingTitle: string;
  requestId?: string;
  ticketId?: string;
  renterId?: string;
  renterName?: string;
  kind: "rent" | "fee" | "deposit" | "expense" | "other";
  label: string;
  /** Income is positive, expenses negative. */
  amount: number;
  /** YYYY-MM-DD */
  due: string;
  method: Method;
  status: "scheduled" | "paid";
  paidAt?: string;
  /** Set on a late fee: the payment it was charged for. */
  lateForId?: string;
  createdAt: string;
};

const LEDGER = "ledger.json";

export async function ledgerFor(ownerId: string) {
  return (await readRows<LedgerEntry>(LEDGER)).filter((e) => e.ownerId === ownerId).sort((a, b) => a.due.localeCompare(b.due));
}
export async function ledgerForRenter(renterId: string) {
  return (await readRows<LedgerEntry>(LEDGER)).filter((e) => e.renterId === renterId);
}

export async function addLedgerEntries(entries: Omit<LedgerEntry, "id" | "createdAt">[]) {
  const now = new Date().toISOString();
  return mutate<LedgerEntry, LedgerEntry[]>(LEDGER, (rows) => {
    const made = entries.map((e) => ({ ...e, id: newId(), createdAt: now }));
    rows.push(...made);
    return made;
  });
}

export async function setLedgerStatus(ownerId: string, id: string, status: LedgerEntry["status"]) {
  return mutate<LedgerEntry, LedgerEntry | null>(LEDGER, (rows) => {
    const e = rows.find((r) => r.id === id && r.ownerId === ownerId);
    if (!e) return null;
    e.status = status;
    e.paidAt = status === "paid" ? new Date().toISOString() : undefined;
    return { ...e };
  });
}

export async function removeLedgerEntry(ownerId: string, id: string) {
  return mutate<LedgerEntry, boolean>(LEDGER, (rows) => {
    const i = rows.findIndex((r) => r.id === id && r.ownerId === ownerId && !r.requestId);
    if (i < 0) return false;
    rows.splice(i, 1);
    return true;
  });
}

/**
 * Charges for an accepted stay, following its payment terms: rent (and
 * monthly fees) for each period, one time fees and the deposit with the
 * first payment. The first payment is always due on move in.
 */
export function chargesFor(
  req: RentalRequest,
  listing: { price: number; fees?: Fee[]; deposit?: number },
  ownerId: string,
  renterName: string,
  opts: { terms?: PaymentTerms; rent?: number; deposit?: number; paidBefore?: string } = {},
) {
  const terms = opts.terms ?? req.terms ?? defaultTerms(req.type);
  const rent = opts.rent ?? req.rent ?? listing.price;
  const deposit = opts.deposit ?? listing.deposit ?? 0;
  const base = {
    ownerId,
    listingId: req.listingId,
    listingTitle: req.title,
    requestId: req.id,
    renterId: req.userId,
    renterName,
    method: terms.method,
  };
  const out: Omit<LedgerEntry, "id" | "createdAt">[] = [];
  // Backdated tenants: anything due before `paidBefore` is recorded as received.
  const push = (e: Omit<LedgerEntry, "id" | "createdAt" | keyof typeof base | "status">) =>
    out.push({ ...base, ...e, status: opts.paidBefore && e.due < opts.paidBefore ? "paid" : "scheduled", ...(opts.paidBefore && e.due < opts.paidBefore ? { paidAt: `${e.due}T12:00:00.000Z` } : {}) });

  if (deposit) push({ kind: "deposit", label: "Security deposit", amount: deposit, due: req.moveIn });
  for (const f of listing.fees ?? []) if (f.frequency === "once") push({ kind: "fee", label: f.name, amount: f.amount, due: req.moveIn });

  const step = terms.frequency === "full" ? req.months : FREQUENCY_MONTHS[terms.frequency];
  for (let m = 0, i = 0; m < req.months; m += step, i++) {
    const covers = Math.min(step, req.months - m);
    const start = addMonths(req.moveIn, m);
    const due = i === 0 || !terms.dueDay ? start : `${start.slice(0, 8)}${String(terms.dueDay).padStart(2, "0")}`;
    const label =
      terms.frequency === "full" ? `Rent, all ${req.months} months` : covers === 1 ? `Rent, month ${m + 1} of ${req.months}` : `Rent, months ${m + 1} to ${m + covers} of ${req.months}`;
    push({ kind: "rent", label, amount: rent * covers, due });
    for (const f of listing.fees ?? [])
      if (f.frequency === "monthly") push({ kind: "fee", label: covers === 1 ? f.name : `${f.name}, ${covers} months`, amount: f.amount * covers, due });
  }
  return out;
}

/**
 * Adds a late fee to each rent payment still open past its grace period,
 * once per payment, for stays whose terms set a late fee.
 */
export async function applyLateFees(ownerId: string, requests: RentalRequest[]) {
  const today = todayISO();
  const withFee = new Map(requests.filter((r) => r.terms?.lateFee).map((r) => [r.id, r]));
  if (!withFee.size) return;
  await mutate<LedgerEntry, void>(LEDGER, (rows) => {
    const charged = new Set(rows.filter((e) => e.lateForId).map((e) => e.lateForId));
    const now = new Date().toISOString();
    for (const e of [...rows]) {
      const req = e.requestId ? withFee.get(e.requestId) : undefined;
      if (!req?.terms || e.ownerId !== ownerId || e.kind !== "rent" || e.status !== "scheduled" || charged.has(e.id)) continue;
      const lateOn = addDays(e.due, req.terms.graceDays + 1);
      if (lateOn > today) continue;
      rows.push({ ...e, id: newId(), createdAt: now, kind: "fee", label: `Late fee for ${e.label.toLowerCase()}`, amount: req.terms.lateFee, due: lateOn, lateForId: e.id });
    }
  });
}

/** The move out clean for a furnished stay, sent to the default cleaner when there is one. */
export async function scheduleMoveOutClean(req: RentalRequest, ownerId: string) {
  const cleaner = (await vendorsFor(ownerId)).find((v) => v.defaultCleaner);
  const date = endDate(req);
  return createTicket(
    {
      ownerId,
      listingId: req.listingId,
      listingTitle: req.title,
      category: "cleaning",
      priority: "normal",
      title: "Move out clean",
      details: `Turnover clean after the furnished stay that ends ${date}.`,
      reportedBy: "system",
      requestId: req.id,
      source: "move-out",
      status: cleaner ? "scheduled" : "approved",
      vendorId: cleaner?.id,
      vendorName: cleaner?.name,
      date,
      window: "11:00-15:00",
    },
    [],
    cleaner ? `Move out clean sent to ${cleaner.name}` : "Move out clean created. Add a cleaner to assign it.",
  );
}

/* ---------------- Renter ratings ---------------- */

export type Rating = {
  id: string;
  ownerId: string;
  renterId: string;
  requestId: string;
  stars: number;
  text: string;
  context: string;
  createdAt: string;
};

const RATINGS = "ratings.json";

export async function allRatings() {
  return readRows<Rating>(RATINGS);
}

export async function addRating(input: Omit<Rating, "id" | "createdAt">) {
  return mutate<Rating, Rating | null>(RATINGS, (rows) => {
    if (rows.some((r) => r.requestId === input.requestId && r.ownerId === input.ownerId)) return null;
    const row = { ...input, id: newId(), createdAt: new Date().toISOString() };
    rows.push(row);
    return row;
  });
}
