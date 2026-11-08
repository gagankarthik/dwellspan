"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { PassportSummary } from "@/lib/passportTypes";
import type { ScreeningAnswer, ScreeningQuestion } from "@/lib/screening";
import { DRAFT_KEY } from "../PropertyTypeDialog";
import { useSession, type SessionUser } from "../session";
import type { Fee } from "@/lib/listings";
import type { Method, PaymentTerms } from "@/lib/terms";

export type OwnerListing = {
  id: string;
  title: string;
  city: string;
  area: string;
  price: number;
  type: string;
  img: string;
  createdAt: string;
  availableFrom?: string;
  availableUntil?: string;
  fees?: Fee[];
  deposit?: number;
  questions?: ScreeningQuestion[];
};
export type RenterRecord = {
  rating: number | null;
  ratingCount: number;
  stays: number;
  latePayments: number;
  reviews: { stars: number; text: string; context: string }[];
};
export type ReceivedRequest = {
  id: string;
  listingId: string;
  title: string;
  type: string;
  moveIn: string;
  endDate: string;
  months: number;
  message: string;
  renter: string;
  renterId: string;
  createdAt: string;
  status: "sent" | "accepted" | "declined";
  record?: RenterRecord;
  passport?: PassportSummary | null;
  answers?: ScreeningAnswer[];
  rated: boolean;
  source: "renter" | "owner";
  terms?: PaymentTerms;
  email?: string;
  phone?: string;
  notes?: string;
  rent?: number;
};
export type Ticket = {
  id: string;
  listingId: string;
  listingTitle: string;
  category: string;
  priority: "low" | "normal" | "urgent";
  title: string;
  details: string;
  photos: string[];
  reportedBy: "owner" | "tenant" | "system";
  reporterName?: string;
  source: "manual" | "move-out";
  status: "pending" | "approved" | "scheduled" | "completed" | "declined";
  vendorId?: string;
  vendorName?: string;
  date?: string;
  window?: string;
  accessCode?: string;
  cost?: number;
  history: { at: string; text: string }[];
  createdAt: string;
  updatedAt: string;
};
export type Vendor = { id: string; name: string; trade: string; phone: string; email: string; defaultCleaner: boolean };
export type LedgerEntry = {
  id: string;
  listingId: string;
  listingTitle: string;
  requestId?: string;
  ticketId?: string;
  renterId?: string;
  renterName?: string;
  kind: "rent" | "fee" | "deposit" | "expense" | "other";
  label: string;
  amount: number;
  due: string;
  method: Method;
  status: "scheduled" | "paid";
  paidAt?: string;
};

type OwnerData = {
  user: SessionUser | null;
  loading: boolean;
  /** Signed in as an owner and every list has loaded. */
  ready: boolean;
  listings: OwnerListing[];
  requests: ReceivedRequest[];
  tickets: Ticket[];
  vendors: Vendor[];
  ledger: LedgerEntry[];
  draftType: string;
  reload: () => Promise<void>;
};

const Ctx = createContext<OwnerData | null>(null);

const get = <T,>(url: string, key: string) =>
  fetch(url, { cache: "no-store" })
    .then((r) => r.json())
    .then((d: Record<string, unknown>) => (d[key] as T[] | undefined) ?? [])
    .catch(() => [] as T[]);

/** Loads everything the dashboard shows once, for every owner page. */
export function OwnerDataProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const [data, setData] = useState<Omit<OwnerData, "user" | "loading" | "ready" | "draftType" | "reload"> | null>(null);
  const [draftType, setDraftType] = useState("");

  const reload = useCallback(async () => {
    const [listings, requests, tickets, vendors, ledger] = await Promise.all([
      get<OwnerListing>("/api/listings/mine", "listings"),
      get<ReceivedRequest>("/api/requests/received", "requests"),
      get<Ticket>("/api/service-requests", "tickets"),
      get<Vendor>("/api/vendors", "vendors"),
      get<LedgerEntry>("/api/ledger", "entries"),
    ]);
    setData({ listings, requests, tickets, vendors, ledger });
  }, []);

  useEffect(() => {
    if (user?.role !== "owner") return;
    const id = window.setTimeout(() => {
      reload();
      try {
        setDraftType((JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as { propertyType?: string }).propertyType ?? "");
      } catch {
        setDraftType("");
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [user, reload]);

  const ready = Boolean(user && user.role === "owner" && data);
  const value: OwnerData = {
    user,
    loading,
    ready,
    listings: data?.listings ?? [],
    requests: data?.requests ?? [],
    tickets: data?.tickets ?? [],
    vendors: data?.vendors ?? [],
    ledger: data?.ledger ?? [],
    draftType,
    reload,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOwnerData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOwnerData must be used inside OwnerDataProvider");
  return v;
}

/** PATCH/POST/DELETE helper that returns the error message, if any. */
export async function send(url: string, method: string, body?: unknown): Promise<{ error?: string; errors?: Record<string, string> }> {
  const res = await fetch(url, {
    method,
    headers: body instanceof FormData || body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null);
  if (!res) return { error: "You look offline. Try again." };
  if (res.ok) return {};
  const d = (await res.json().catch(() => ({}))) as { error?: string; errors?: Record<string, string> };
  return { error: d.error ?? (d.errors ? undefined : "Something went wrong. Try again."), errors: d.errors };
}
