/** Payment terms for a stay or lease. Safe to import on the client. */

export const FREQUENCIES = ["monthly", "quarterly", "yearly", "full"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const METHODS = ["card", "ach", "manual"] as const;
export type Method = (typeof METHODS)[number];

export type PaymentTerms = {
  frequency: Frequency;
  /** 0 = on the move in day each period, otherwise the day of the month (1 to 28). */
  dueDay: number;
  method: Method;
  /** Charged when a payment is still open this many days after it is due. 0 = no late fee. */
  lateFee: number;
  graceDays: number;
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: "Monthly",
  quarterly: "Every 3 months",
  yearly: "Yearly",
  full: "In full up front",
};
/** Months each payment covers. */
export const FREQUENCY_MONTHS: Record<Exclude<Frequency, "full">, number> = { monthly: 1, quarterly: 3, yearly: 12 };

export const METHOD_LABEL: Record<Method, string> = { card: "Card", ach: "ACH autopay", manual: "Check, cash, or transfer" };

export const defaultTerms = (type: "monthly" | "yearly"): PaymentTerms => ({
  frequency: "monthly",
  dueDay: type === "yearly" ? 1 : 0,
  method: type === "yearly" ? "ach" : "card",
  lateFee: 0,
  graceDays: 5,
});

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** "Monthly on the 1st by ACH autopay, $50 late fee after 5 days" */
export function describeTerms(t: PaymentTerms) {
  const when = t.frequency === "full" ? "" : t.dueDay ? ` on the ${ordinal(t.dueDay)}` : " on the move in day";
  const late = t.lateFee ? `, $${t.lateFee} late fee after ${t.graceDays} ${t.graceDays === 1 ? "day" : "days"}` : "";
  return `${FREQUENCY_LABEL[t.frequency]}${when} by ${METHOD_LABEL[t.method].toLowerCase().replace("ach", "ACH")}${late}`;
}

/** Checks and cleans terms from a request body. */
export function parseTerms(raw: unknown, type: "monthly" | "yearly"): PaymentTerms {
  const d = defaultTerms(type);
  const b = (raw ?? {}) as Partial<Record<keyof PaymentTerms, unknown>>;
  const frequency = FREQUENCIES.includes(b.frequency as Frequency) ? (b.frequency as Frequency) : d.frequency;
  const method = METHODS.includes(b.method as Method) ? (b.method as Method) : d.method;
  const dueDay = Number.isInteger(Number(b.dueDay)) && Number(b.dueDay) >= 0 && Number(b.dueDay) <= 28 ? Number(b.dueDay) : d.dueDay;
  const lateFee = Math.min(Math.max(Math.round(Number(b.lateFee) || 0), 0), 5000);
  const graceDays = Math.min(Math.max(Math.round(Number(b.graceDays) || 0), 0), 30);
  return { frequency, method, dueDay, lateFee, graceDays };
}
