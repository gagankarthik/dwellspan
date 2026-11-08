"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  AlertIcon,
  CalendarIcon,
  CardIcon,
  HelpIcon,
  HomeIcon,
  InboxIcon,
  LedgerIcon,
  OverviewIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TeamIcon,
  UserIcon,
  WrenchIcon,
} from "../icons";
import { PropertyTypeDialog, openListProperty } from "../PropertyTypeDialog";
import { WorkspaceShell, type Alert } from "../WorkspaceShell";
import { todayISO } from "./ui";
import { OwnerDataProvider, useOwnerData } from "./useOwnerData";

/** The owner workspace: its own sidebar and top bar, no public nav or footer. */
export function OwnerShell({ children }: { children: ReactNode }) {
  return (
    <OwnerDataProvider>
      <Shell>{children}</Shell>
    </OwnerDataProvider>
  );
}

function useAttention() {
  const { ready, requests, tickets, ledger } = useOwnerData();
  // Owner data only loads in the browser, so the clock is never read during prerender.
  if (!ready) return { requests: 0, tickets: 0, overdue: 0, alerts: [] as Alert[] };
  const today = todayISO();
  const pendingRequests = requests.filter((r) => r.status === "sent");
  const pendingTickets = tickets.filter((t) => t.status === "pending" || t.status === "approved");
  const overdue = ledger.filter((e) => e.status === "scheduled" && e.amount > 0 && e.due < today);
  const alerts: Alert[] = [
    ...pendingRequests.map((r) => ({ key: r.id, href: "/dashboard/requests", Icon: InboxIcon, title: `${r.renter} wants to ${r.type === "yearly" ? "lease" : "book"} ${r.title}`, meta: `Move in ${r.moveIn}` })),
    ...pendingTickets.map((t) => ({ key: t.id, href: "/dashboard/service", Icon: WrenchIcon, title: t.status === "pending" ? `Approve: ${t.title}` : `Book a vendor: ${t.title}`, meta: t.listingTitle })),
    ...(overdue.length ? [{ key: "overdue", href: "/dashboard/payments", Icon: AlertIcon, title: `${overdue.length} ${overdue.length === 1 ? "payment is" : "payments are"} past due`, meta: "Open payments" }] : []),
  ];
  return { requests: pendingRequests.length, tickets: pendingTickets.length, overdue: overdue.length, alerts };
}

function Shell({ children }: { children: ReactNode }) {
  const { user, loading } = useOwnerData();
  const router = useRouter();
  const a = useAttention();

  // Owners only: signed out goes to the owner page, renters to their own page.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/list-your-property");
    else if (user.role !== "owner") router.replace("/account");
  }, [loading, user, router]);

  return (
    <>
      <WorkspaceShell
        home="/dashboard"
        label="Owner dashboard"
        wide={["/dashboard/calendar"]}
        user={user}
        alerts={a.alerts}
        cta={
          <button type="button" onClick={() => openListProperty()} className="btn-primary button-sm h-10 w-full">
            <PlusIcon className="size-4" strokeWidth={2.25} /> List a property
          </button>
        }
        groups={[
          {
            label: "Workspace",
            items: [
              { href: "/dashboard", label: "Overview", Icon: OverviewIcon },
              { href: "/dashboard/calendar", label: "Calendar", Icon: CalendarIcon },
              { href: "/dashboard/properties", label: "Properties", Icon: HomeIcon },
              { href: "/dashboard/customers", label: "Customers", Icon: UserIcon },
            ],
          },
          {
            label: "Inbox",
            items: [
              { href: "/dashboard/requests", label: "Rental requests", Icon: InboxIcon, count: a.requests },
              { href: "/dashboard/service", label: "Service requests", Icon: WrenchIcon, count: a.tickets },
            ],
          },
          {
            label: "Money",
            items: [
              { href: "/dashboard/payments", label: "Payments", Icon: CardIcon, count: a.overdue },
              { href: "/dashboard/ledger", label: "Ledger", Icon: LedgerIcon },
            ],
          },
          {
            label: "Manage",
            items: [
              { href: "/dashboard/team", label: "Team and vendors", Icon: TeamIcon },
              { href: "/dashboard/settings", label: "Settings", Icon: SettingsIcon },
            ],
          },
        ]}
        help={{
          title: "Need a hand?",
          body: "Payouts, fees, cleaning, and screening, answered.",
          links: [
            { href: "/list-your-property#faq", label: "Owner help", Icon: HelpIcon },
            { href: "/explore", label: "View renter site", Icon: SearchIcon },
          ],
        }}
        menu={[
          { href: "/dashboard/settings", label: "Account settings", Icon: SettingsIcon },
          { href: "/dashboard/team", label: "Team and vendors", Icon: TeamIcon },
          { href: "/explore", label: "View renter site", Icon: SearchIcon },
        ]}
      >
        {children}
      </WorkspaceShell>
      <PropertyTypeDialog />
    </>
  );
}
