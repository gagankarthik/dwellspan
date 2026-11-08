"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CalendarIcon, CardIcon, HeartIcon, HelpIcon, HomeIcon, OverviewIcon, SearchIcon, SettingsIcon, UserIcon, WrenchIcon } from "../icons";
import { ViewSkeleton, todayISO } from "../dashboard-ui";
import { useSession, type SessionUser } from "../session";
import { WorkspaceShell, type Alert } from "../WorkspaceShell";

export type Stay = {
  id: string;
  listingId: string;
  title: string;
  city: string;
  area: string;
  img: string;
  price: number;
  type: "monthly" | "yearly";
  moveIn: string;
  endDate: string;
  months: number;
  message: string;
  status: "sent" | "accepted" | "declined";
  createdAt: string;
};
export type Payment = {
  id: string;
  listingTitle: string;
  requestId?: string;
  kind: string;
  label: string;
  amount: number;
  due: string;
  method: "card" | "ach" | "manual";
  status: "scheduled" | "paid";
  paidAt?: string;
};
export type Repair = {
  id: string;
  listingTitle: string;
  title: string;
  details: string;
  category: string;
  priority: string;
  status: "pending" | "approved" | "scheduled" | "completed" | "declined";
  vendorName?: string;
  date?: string;
  window?: string;
  photos: string[];
  history: { at: string; text: string }[];
  createdAt: string;
};
export type RepairHome = { requestId: string; title: string; city: string; moveIn: string; endDate: string };

type Data = {
  user: SessionUser | null;
  ready: boolean;
  stays: Stay[];
  payments: Payment[];
  repairs: Repair[];
  repairHomes: RepairHome[];
  reload: () => Promise<void>;
};

const Ctx = createContext<Data | null>(null);
const get = <T,>(url: string, key: string) =>
  fetch(url, { cache: "no-store" })
    .then((r) => r.json())
    .then((d: Record<string, unknown>) => (d[key] as T[] | undefined) ?? [])
    .catch(() => [] as T[]);

export function useRenterData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRenterData must be used inside RenterShell");
  return v;
}

export function RenterReady({ children }: { children: ReactNode }) {
  return useRenterData().ready ? <>{children}</> : <ViewSkeleton />;
}

/** The renter's own space: stays, payments, repairs, and saved homes. */
export function RenterShell({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Omit<Data, "user" | "ready" | "reload"> | null>(null);

  const reload = useCallback(async () => {
    const [stays, payments, repairsRes] = await Promise.all([
      get<Stay>("/api/requests", "requests"),
      get<Payment>("/api/payments", "payments"),
      fetch("/api/service-requests", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ tickets?: Repair[]; homes?: RepairHome[] }>)
        .catch(() => ({}) as { tickets?: Repair[]; homes?: RepairHome[] }),
    ]);
    setData({ stays, payments, repairs: repairsRes.tickets ?? [], repairHomes: repairsRes.homes ?? [] });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    else if (user.role === "owner") router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.role !== "renter") return;
    const id = window.setTimeout(reload, 0);
    return () => window.clearTimeout(id);
  }, [user, reload]);

  const ready = Boolean(user && user.role === "renter" && data);
  const value: Data = { user, ready, stays: data?.stays ?? [], payments: data?.payments ?? [], repairs: data?.repairs ?? [], repairHomes: data?.repairHomes ?? [], reload };

  // The clock is only read once data has loaded in the browser.
  const alerts: Alert[] = [];
  let due = 0;
  if (ready) {
    const today = todayISO();
    const late = value.payments.filter((p) => p.status === "scheduled" && p.due < today);
    due = late.length;
    if (late.length) alerts.push({ key: "late", href: "/account/payments", Icon: CardIcon, title: `${late.length} ${late.length === 1 ? "payment is" : "payments are"} past due`, meta: "Open payments" });
    for (const r of value.repairs.filter((x) => x.status === "scheduled" && x.date && x.date >= today))
      alerts.push({ key: r.id, href: "/account/repairs", Icon: WrenchIcon, title: `${r.title}: repair booked`, meta: `${r.vendorName ?? "Vendor"} on ${r.date}` });
    for (const s of value.stays.filter((x) => x.status === "accepted" && x.moveIn >= today))
      alerts.push({ key: s.id, href: "/account/stays", Icon: CalendarIcon, title: `Move in to ${s.title}`, meta: s.moveIn });
  }

  return (
    <Ctx.Provider value={value}>
      <WorkspaceShell
        home="/account"
        label="Your account"
        user={user}
        alerts={alerts}
        cta={
          <Link href="/explore" className="btn-primary button-sm h-10 w-full">
            <SearchIcon className="size-4" /> Find a home
          </Link>
        }
        groups={[
          {
            label: "Your rentals",
            items: [
              { href: "/account", label: "Overview", Icon: OverviewIcon },
              { href: "/account/stays", label: "Stays and requests", Icon: HomeIcon },
              { href: "/account/payments", label: "Payments", Icon: CardIcon, count: due },
              { href: "/account/repairs", label: "Repairs", Icon: WrenchIcon },
            ],
          },
          {
            label: "Account",
            items: [
              { href: "/account/passport", label: "Renter Passport", Icon: UserIcon },
              { href: "/account/saved", label: "Saved homes", Icon: HeartIcon },
              { href: "/account/settings", label: "Settings", Icon: SettingsIcon },
            ],
          },
        ]}
        help={{
          title: "Need a hand?",
          body: "Booking, payments, and repairs, answered.",
          links: [
            { href: "/how-it-works", label: "How it works", Icon: HelpIcon },
            { href: "/explore", label: "Explore homes", Icon: SearchIcon },
          ],
        }}
        menu={[
          { href: "/account/settings", label: "Account settings", Icon: SettingsIcon },
          { href: "/account/saved", label: "Saved homes", Icon: HeartIcon },
          { href: "/explore", label: "Explore homes", Icon: SearchIcon },
        ]}
      >
        {children}
      </WorkspaceShell>
    </Ctx.Provider>
  );
}
