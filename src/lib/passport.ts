/**
 * Renter Passport: one screening profile a renter completes once and reuses
 * for every furnished stay and lease on Dwellspan. Stored in .data/passports.json.
 *
 * Verification is SIMULATED. No identity, credit, or background check is run:
 * submitting marks the checks clear so the product flow can be exercised end
 * to end. Before launch, replace `runChecks` with a screening provider (the
 * provider's hosted flow should collect SSN and date of birth; never store them
 * here) and charge PASSPORT_FEE through the payments stack.
 */
import { mutate, readRows } from "./store";
import {
  EMPTY_PASSPORT,
  PASSPORT_CHECKS,
  PASSPORT_VALID_DAYS,
  type CheckKey,
  type MoveReason,
  type Passport,
  type PassportForm,
  type PassportSummary,
  type YesNo,
} from "./passportTypes";

export * from "./passportTypes";

const FILE = "passports.json";

const blankChecks = (): Passport["checks"] =>
  Object.fromEntries(PASSPORT_CHECKS.map(([k]) => [k, { status: "not_started" }])) as Passport["checks"];

export async function getPassport(userId: string) {
  return (await readRows<Passport>(FILE)).find((p) => p.userId === userId) ?? null;
}

export async function passportsFor(userIds: string[]) {
  const set = new Set(userIds);
  return (await readRows<Passport>(FILE)).filter((p) => set.has(p.userId));
}

export type PassportInput = PassportForm;

const REASONS: MoveReason[] = ["new-job", "travel-nurse", "corporate", "remote", "student", "other"];
const SOURCES = ["salary", "contract", "self-employed", "relocation-stipend", "other"] as const;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Cleans a request body. Verification needs the full set; drafts can be partial. */
export function parsePassport(raw: unknown, forVerify: boolean): { input: PassportInput; errors: Record<string, string> } {
  const b = (raw ?? {}) as Record<string, unknown>;
  const s = (k: string, max: number) => String(b[k] ?? "").trim().slice(0, max);
  const int = (k: string, min: number, max: number, fallback = 0) => Math.min(Math.max(Math.round(Number(b[k]) || fallback), min), max);
  const yn = (k: string): YesNo => (b[k] === "yes" || b[k] === "no" ? b[k] : "");
  const month = (k: string) => (MONTH_RE.test(s(k, 7)) ? s(k, 7) : "");
  const phone = (k: string) => s(k, 24).replace(/[^\d+()\-\s]/g, "");
  const input: PassportInput = {
    ...EMPTY_PASSPORT,
    legalName: s("legalName", 100),
    phone: phone("phone"),
    currentCity: s("currentCity", 80),
    moveReason: REASONS.includes(b.moveReason as MoveReason) ? (b.moveReason as MoveReason) : "other",
    employer: s("employer", 100),
    jobTitle: s("jobTitle", 100),
    monthlyIncome: int("monthlyIncome", 0, 1_000_000),
    incomeSource: SOURCES.includes(b.incomeSource as (typeof SOURCES)[number]) ? (b.incomeSource as PassportInput["incomeSource"]) : "salary",
    employmentStart: month("employmentStart"),
    contractEnd: month("contractEnd"),
    occupants: int("occupants", 1, 12, 1),
    pets: s("pets", 160),
    vehicles: int("vehicles", 0, 6),
    smoker: yn("smoker"),
    yearsRenting: int("yearsRenting", 0, 60),
    monthsAtAddress: int("monthsAtAddress", 0, 600),
    currentRent: int("currentRent", 0, 100_000),
    landlordName: s("landlordName", 100),
    landlordContact: s("landlordContact", 120),
    evicted: yn("evicted"),
    brokeLease: yn("brokeLease"),
    emergencyName: s("emergencyName", 100),
    emergencyPhone: phone("emergencyPhone"),
    emergencyRelation: s("emergencyRelation", 40),
    consent: b.consent === true,
  };
  const errors: Record<string, string> = {};
  if (forVerify) {
    const contract = input.incomeSource === "contract" || input.moveReason === "travel-nurse";
    if (input.legalName.split(/\s+/).filter(Boolean).length < 2) errors.legalName = "Enter your full legal name, as on your ID.";
    if (input.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a phone number we can reach you on.";
    if (!input.currentCity) errors.currentCity = "Where do you live now?";
    if (input.monthlyIncome < 1) errors.monthlyIncome = "Enter your monthly income before tax.";
    if (!input.employer && input.incomeSource !== "self-employed") errors.employer = "Who pays you? Enter your employer or agency.";
    if (!input.employmentStart) errors.employmentStart = "When did this job or contract start?";
    if (contract && !input.contractEnd) errors.contractEnd = "When does your contract end? Owners use it to match lease lengths.";
    if (input.contractEnd && input.employmentStart && input.contractEnd < input.employmentStart) errors.contractEnd = "The end comes before the start.";
    if (!input.smoker) errors.smoker = "Choose yes or no.";
    if (input.yearsRenting > 0) {
      if (!input.landlordName) errors.landlordName = "Who do you rent from now? A person or a company.";
      if (input.landlordContact.length < 7) errors.landlordContact = "A phone number or email for your current landlord.";
    }
    if (!input.evicted) errors.evicted = "Choose yes or no.";
    if (!input.brokeLease) errors.brokeLease = "Choose yes or no.";
    if (!input.emergencyName) errors.emergencyName = "Who should we call in an emergency?";
    if (input.emergencyPhone.replace(/\D/g, "").length < 10) errors.emergencyPhone = "Enter their phone number.";
    if (!input.consent) errors.consent = "We need your consent to run the checks.";
  }
  return { input, errors };
}

/** Saves the profile. Changing your legal name means the identity check has to run again. */
export async function savePassport(userId: string, input: PassportInput) {
  return mutate<Passport, Passport>(FILE, (rows) => {
    const now = new Date().toISOString();
    let row = rows.find((p) => p.userId === userId);
    if (!row) {
      row = { userId, ...input, checks: blankChecks(), provider: "simulated", createdAt: now, updatedAt: now };
      rows.push(row);
    } else {
      const renamed = row.legalName && row.legalName !== input.legalName;
      Object.assign(row, input, { updatedAt: now });
      if (renamed) {
        row.checks = blankChecks();
        row.verifiedAt = undefined;
        row.expiresAt = undefined;
      }
    }
    return { ...row };
  });
}

/** Simulated screening. See the note at the top of this file. */
function runChecks(): Passport["checks"] {
  const at = new Date().toISOString();
  const out = {} as Passport["checks"];
  for (const [k] of PASSPORT_CHECKS) out[k as CheckKey] = { status: "clear", at };
  return out;
}

export async function verifyPassport(userId: string) {
  return mutate<Passport, Passport | null>(FILE, (rows) => {
    const row = rows.find((p) => p.userId === userId);
    if (!row) return null;
    const now = new Date();
    row.checks = runChecks();
    row.verifiedAt = now.toISOString();
    row.expiresAt = new Date(now.getTime() + PASSPORT_VALID_DAYS * 86_400_000).toISOString();
    row.feePaidAt ??= now.toISOString();
    row.updatedAt = now.toISOString();
    return { ...row };
  });
}

export const isVerified = (p: Passport | null) =>
  Boolean(p?.verifiedAt && p.expiresAt && p.expiresAt > new Date().toISOString() && PASSPORT_CHECKS.every(([k]) => p.checks[k as CheckKey]?.status === "clear"));

/**
 * What an owner sees when this renter applies. Income is shown as a multiple
 * of the rent, never the raw number. The emergency contact is only shared once
 * the owner has accepted.
 */
export function summarize(p: Passport | null, rent: number, accepted = false): PassportSummary | null {
  if (!p) return null;
  const x = { ...EMPTY_PASSPORT, ...p };
  return {
    verified: isVerified(p),
    verifiedAt: p.verifiedAt,
    expiresAt: p.expiresAt,
    checks: p.checks,
    moveReason: x.moveReason,
    employer: x.employer,
    jobTitle: x.jobTitle,
    incomeToRent: rent > 0 && x.monthlyIncome > 0 ? Math.round((x.monthlyIncome / rent) * 10) / 10 : null,
    employmentStart: x.employmentStart,
    contractEnd: x.contractEnd,
    occupants: x.occupants,
    pets: x.pets,
    vehicles: x.vehicles,
    smoker: x.smoker,
    yearsRenting: x.yearsRenting,
    monthsAtAddress: x.monthsAtAddress,
    currentRent: x.currentRent,
    landlordName: x.landlordName,
    landlordContact: x.landlordContact,
    evicted: x.evicted,
    brokeLease: x.brokeLease,
    emergency: accepted && x.emergencyName ? { name: x.emergencyName, phone: x.emergencyPhone, relation: x.emergencyRelation } : null,
    simulated: p.provider === "simulated",
  };
}
