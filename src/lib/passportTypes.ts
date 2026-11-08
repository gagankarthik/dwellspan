/** Renter Passport types and labels. Safe to import on the client. */

export type CheckKey = "identity" | "credit" | "background" | "income";
export type CheckStatus = "not_started" | "pending" | "clear" | "review";
export type MoveReason = "new-job" | "travel-nurse" | "corporate" | "remote" | "student" | "other";
export type YesNo = "" | "yes" | "no";
export type IncomeSource = "salary" | "contract" | "self-employed" | "relocation-stipend" | "other";

export type Passport = {
  userId: string;
  legalName: string;
  phone: string;
  currentCity: string;
  moveReason: MoveReason;
  employer: string;
  jobTitle: string;
  /** Before tax, per month. Never shown to owners; they see a multiple of rent. */
  monthlyIncome: number;
  incomeSource: IncomeSource;
  /** YYYY-MM the current job or contract started */
  employmentStart: string;
  /** YYYY-MM a contract ends; blank for permanent roles */
  contractEnd: string;
  occupants: number;
  pets: string;
  vehicles: number;
  smoker: YesNo;
  yearsRenting: number;
  /** Rental history: where they live now and who can vouch for them. */
  monthsAtAddress: number;
  currentRent: number;
  landlordName: string;
  landlordContact: string;
  /** Self reported, last 7 years. The background check confirms. */
  evicted: YesNo;
  brokeLease: YesNo;
  /** Shared with an owner only once they accept the request. */
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  consent: boolean;
  checks: Record<CheckKey, { status: CheckStatus; at?: string }>;
  feePaidAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  provider: "simulated";
  createdAt: string;
  updatedAt: string;
};

export type PassportSummary = {
  verified: boolean;
  verifiedAt?: string;
  expiresAt?: string;
  checks: Passport["checks"];
  moveReason: MoveReason;
  employer: string;
  jobTitle: string;
  incomeToRent: number | null;
  employmentStart: string;
  contractEnd: string;
  occupants: number;
  pets: string;
  vehicles: number;
  smoker: YesNo;
  yearsRenting: number;
  monthsAtAddress: number;
  /** What they pay now, per month. 0 when not given. */
  currentRent: number;
  landlordName: string;
  landlordContact: string;
  evicted: YesNo;
  brokeLease: YesNo;
  /** Only filled once the owner has accepted. */
  emergency: { name: string; phone: string; relation: string } | null;
  simulated: boolean;
};

/** Fields a renter fills in. Everything else on a Passport is set by Dwellspan. */
export type PassportForm = Omit<Passport, "userId" | "checks" | "feePaidAt" | "verifiedAt" | "expiresAt" | "provider" | "createdAt" | "updatedAt">;

export const EMPTY_PASSPORT: PassportForm = {
  legalName: "",
  phone: "",
  currentCity: "",
  moveReason: "new-job",
  employer: "",
  jobTitle: "",
  monthlyIncome: 0,
  incomeSource: "salary",
  employmentStart: "",
  contractEnd: "",
  occupants: 1,
  pets: "",
  vehicles: 0,
  smoker: "",
  yearsRenting: 0,
  monthsAtAddress: 0,
  currentRent: 0,
  landlordName: "",
  landlordContact: "",
  evicted: "",
  brokeLease: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  consent: false,
};

/** One time fee, paid once, reused on every application. */
export const PASSPORT_FEE = 39;
export const PASSPORT_VALID_DAYS = 180;

export const PASSPORT_CHECKS: [CheckKey, string, string][] = [
  ["identity", "Identity", "Government ID matched to a live selfie"],
  ["credit", "Credit", "Soft pull, no effect on your score"],
  ["background", "Background", "Criminal and eviction records"],
  ["income", "Income", "Pay stubs, offer letter, or bank link"],
];

export const MOVE_REASONS: [MoveReason, string][] = [
  ["new-job", "Starting a new job"],
  ["travel-nurse", "Travel nurse or clinician contract"],
  ["corporate", "Corporate assignment or relocation"],
  ["remote", "Remote worker trying a new city"],
  ["student", "Studies or a research post"],
  ["other", "Something else"],
];

export const INCOME_SOURCES: [IncomeSource, string][] = [
  ["salary", "Salary or wages"],
  ["contract", "Contract or agency pay"],
  ["self-employed", "Self employed"],
  ["relocation-stipend", "Relocation or housing stipend"],
  ["other", "Other"],
];

export const moveReasonLabel = (r: MoveReason) => MOVE_REASONS.find(([k]) => k === r)?.[1] ?? "Something else";
