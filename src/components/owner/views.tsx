"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  AlertIcon,
  ArrowIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  InboxIcon,
  KeyIcon,
  LedgerIcon,
  PlusIcon,
  SparkleIcon,
  WrenchIcon,
} from "../icons";
import { Dialog } from "../Dialog";
import { openListProperty } from "../PropertyTypeDialog";
import { propertyTypeLabel } from "../propertyTypes";
import { initials, logout } from "../session";
import { IncomeChart, RankBars, Ring, SplitBar, Spark, SWATCH } from "./charts";
import { addDays, incomeByMonth, ledgerTotals, occupancy } from "./metrics";
import { AddPropertyButton, Card, Empty, Notice, OwnerReady, PageHeader, Pill, money, monthKey, pretty, shiftMonth, todayISO } from "./ui";
import { send, useOwnerData, type OwnerListing } from "./useOwnerData";

/* ---------------- Overview ---------------- */

export function OverviewView() {
  return (
    <OwnerReady>
      <Overview />
    </OwnerReady>
  );
}

function Stat({ label, value, sub, href, icon, trend }: { label: string; value: string; sub: ReactNode; href: string; icon: ReactNode; trend?: number[] }) {
  return (
    <Link href={href} className="focus-ring group flex flex-col rounded-2xl border border-line/70 bg-paper p-6 shadow-sm transition-shadow duration-300 ease-base hover:shadow-md">
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 body-5 text-ink-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">{icon}</span>
          {label}
        </span>
        <ArrowIcon className="size-4 text-ink-3 transition-transform duration-300 ease-base group-hover:translate-x-1" />
      </span>
      <span className="mt-4 flex items-end justify-between gap-2">
        <span className="heading-3 text-ink">{value}</span>
        {trend && <Spark values={trend} />}
      </span>
      <span className="mt-1 caption-5 text-ink-2">{sub}</span>
    </Link>
  );
}

function Overview() {
  const { user, listings, requests, tickets, ledger, draftType } = useOwnerData();
  if (!user) return null;
  const first = user.name.split(/\s+/)[0];
  if (listings.length === 0) return <Onboarding first={first} draftType={draftType} />;

  const today = todayISO();
  const thisMonth = monthKey(today);
  const months = incomeByMonth(ledger, shiftMonth(thisMonth, -5), 12, thisMonth);
  const current = months[5];
  const totals = ledgerTotals(ledger, today);
  const next30 = ledger.filter((e) => e.amount > 0 && e.status === "scheduled" && e.due >= today && e.due <= addDays(today, 30)).reduce((s, e) => s + e.amount, 0);
  const occ = occupancy(listings, requests, today);
  const waiting = requests.filter((r) => r.status === "sent").length;
  const openTickets = tickets.filter((t) => t.status === "pending" || t.status === "approved").length;

  const accepted = requests.filter((r) => r.status === "accepted");
  const furnished = accepted.filter((r) => r.type !== "yearly").length;
  const leases = accepted.length - furnished;

  const byUnit = listings
    .map((l) => ({
      key: l.id,
      label: l.title,
      value: ledger.filter((e) => e.listingId === l.id && e.amount > 0).reduce((s, e) => s + e.amount, 0),
      note: `${money(l.price)} a month · ${l.type === "yearly" ? "Lease" : "Furnished"}`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const ticketStatus = [
    { key: "pending", label: "Waiting for approval", Icon: AlertIcon, tone: "warn" as const },
    { key: "approved", label: "Needs a vendor", Icon: WrenchIcon, tone: "brand" as const },
    { key: "scheduled", label: "Booked", Icon: CalendarIcon, tone: "brand" as const },
    { key: "completed", label: "Done", Icon: CheckIcon, tone: "good" as const },
  ].map((s) => ({ ...s, n: tickets.filter((t) => t.status === s.key).length }));

  const horizon = addDays(today, 30);
  const agenda = [
    ...accepted.filter((r) => r.moveIn >= today && r.moveIn <= horizon).map((r) => ({ date: r.moveIn, Icon: KeyIcon, title: `${r.renter} moves in`, meta: r.title })),
    ...accepted.filter((r) => r.endDate >= today && r.endDate <= horizon).map((r) => ({ date: r.endDate, Icon: HomeIcon, title: `${r.renter} moves out`, meta: r.title })),
    ...tickets
      .filter((t) => t.status === "scheduled" && t.date && t.date >= today && t.date <= horizon)
      .map((t) => ({ date: t.date!, Icon: t.category === "cleaning" ? SparkleIcon : WrenchIcon, title: t.title, meta: `${t.vendorName ?? "Vendor"} · ${t.window ?? ""} · ${t.listingTitle}` })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greet}, ${first}`}
        intro={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + ". Here is how your homes are doing."}
        action={
          <>
            <Link href="/dashboard/service?new=1" className="btn-secondary button-sm h-10">
              <WrenchIcon className="size-4" /> New service request
            </Link>
            <AddPropertyButton />
          </>
        }
      />

      {draftType && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand p-6 text-paper shadow-md">
          <div>
            <p className="subhead">Continue your {propertyTypeLabel(draftType).toLowerCase()} listing</p>
            <p className="mt-1 body-6 text-paper">Your draft is saved. Pick up at the next step.</p>
          </div>
          <Link href="/list-your-property?start=1" className="focus-ring-dark inline-flex h-10 items-center rounded-lg bg-paper px-4 button-sm text-ink hover:bg-sand">
            Continue listing
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Collected this month"
          value={money(current.paid)}
          sub={current.scheduled ? `${money(current.scheduled)} still scheduled` : "Nothing else due this month"}
          href="/dashboard/ledger"
          icon={<LedgerIcon className="size-4" />}
          trend={months.slice(0, 6).map((m) => m.paid)}
        />
        <Stat label="Due in the next 30 days" value={money(next30)} sub={totals.overdue ? `${money(totals.overdue)} past due` : "No late payments"} href="/dashboard/ledger" icon={<ClockIcon className="size-4" />} />
        <Stat label="Rental requests" value={String(waiting)} sub={waiting ? "Waiting for your answer" : `${accepted.length} accepted so far`} href="/dashboard/requests" icon={<InboxIcon className="size-4" />} />
        <Stat label="Open service requests" value={String(openTickets)} sub={openTickets ? "Approve or book a vendor" : "Nothing needs you"} href="/dashboard/service" icon={<WrenchIcon className="size-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Income by month"
          className="lg:col-span-2"
          action={
            <Link href="/dashboard/ledger" className="focus-ring rounded caption-4 text-ink-2 underline underline-offset-4 hover:text-brand">
              Open ledger
            </Link>
          }
        >
          {ledger.length ? (
            <IncomeChart data={months} />
          ) : (
            <p className="rounded-xl bg-sand px-4 py-12 text-center body-6 text-ink-2">Rent and fees appear here once you accept a request.</p>
          )}
        </Card>
        <Card title="Occupancy">
          <Ring value={occ.rate} label="Booked, next 90 days" sub={`${occ.booked} of ${occ.open} open nights across ${listings.length} ${listings.length === 1 ? "unit" : "units"}`} />
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 title-5 text-ink-2">Accepted stays by type</p>
            <SplitBar
              parts={[
                { label: "Furnished", value: furnished, fill: SWATCH.paid },
                { label: "Lease", value: leases, fill: SWATCH.lease },
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Earnings by property">
          <RankBars rows={byUnit} empty={<p className="body-6 text-ink-2">No charges yet.</p>} />
        </Card>
        <Card
          title="Service requests"
          action={
            <Link href="/dashboard/service?new=1" className="focus-ring inline-flex items-center gap-1 rounded caption-4 text-brand hover:underline">
              <PlusIcon className="size-3" strokeWidth={2.5} /> New
            </Link>
          }
        >
          <ul className="grid grid-cols-2 gap-2">
            {ticketStatus.map(({ key, label, Icon, n, tone }) => (
              <li key={key}>
                <Link href={`/dashboard/service?tab=${key === "completed" ? "done" : key === "scheduled" ? "scheduled" : "action"}`} className="focus-ring block rounded-xl bg-sand p-4 transition-colors duration-300 ease-base hover:bg-line/60">
                  <Pill tone={tone}>
                    <Icon className="size-3" /> {label}
                  </Pill>
                  <span className="mt-2 block heading-3 text-ink">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card
          title="Next 30 days"
          action={
            <Link href="/dashboard/calendar" className="focus-ring rounded caption-4 text-ink-2 underline underline-offset-4 hover:text-brand">
              Calendar
            </Link>
          }
        >
          {agenda.length === 0 ? (
            <p className="body-6 text-ink-2">No move ins, move outs, or jobs booked.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {agenda.slice(0, 5).map((a, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-line py-1">
                    <span className="caption-5 uppercase text-ink-2">{new Date(`${a.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span>
                    <span className="title-4 leading-none text-ink">{+a.date.slice(8)}</span>
                  </span>
                  <a.Icon className="size-4 shrink-0 text-ink-3" />
                  <span className="min-w-0">
                    <span className="block truncate body-5 text-ink">{a.title}</span>
                    <span className="block truncate caption-5 text-ink-2">{a.meta}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

    </div>
  );
}

export function RequestStatus({ status }: { status: string }) {
  if (status === "accepted")
    return (
      <Pill tone="good">
        <CheckIcon className="size-3" strokeWidth={2.5} /> Accepted
      </Pill>
    );
  if (status === "declined") return <Pill>Declined</Pill>;
  return (
    <Pill tone="warn">
      <ClockIcon className="size-3" /> Waiting for you
    </Pill>
  );
}

function Onboarding({ first, draftType }: { first: string; draftType: string }) {
  const steps = [
    { t: "Create your owner account", b: "Done. Renters will see you as a verified owner.", done: true },
    { t: draftType ? `Finish your ${propertyTypeLabel(draftType).toLowerCase()} listing` : "List your first property", b: "Type, dates, location, photos, rent, and fees. About ten minutes.", done: false },
    { t: "Add your cleaner", b: "Move out cleans go to them on their own after every furnished stay.", done: false, href: "/dashboard/team" },
    { t: "Start getting requests", b: "Booking requests and lease applications land in Rental requests.", done: false },
  ];
  return (
    <section aria-labelledby="welcome-title" className="overflow-hidden rounded-3xl bg-paper shadow-lg">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="p-8 md:p-12">
          <p className="caption-3 text-brand">Welcome, {first}</p>
          <h1 id="welcome-title" className="mt-2 heading-1 text-ink">
            Let us get your first
            <br className="hidden sm:block" /> home in front of renters
          </h1>
          <ol className="mt-8 flex flex-col gap-4">
            {steps.map((st, i) => (
              <li key={st.t} className="flex gap-4">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full caption-3 ${st.done ? "bg-ink text-paper" : i === 1 ? "bg-brand text-paper" : "bg-sand text-ink-2"}`}>
                  {st.done ? <CheckIcon className="size-4" strokeWidth={2.5} /> : i + 1}
                </span>
                <span>
                  <span className={`block title-3 ${st.done ? "text-ink-2 line-through" : "text-ink"}`}>
                    {st.href ? (
                      <Link href={st.href} className="focus-ring rounded underline-offset-4 hover:underline">
                        {st.t}
                      </Link>
                    ) : (
                      st.t
                    )}
                  </span>
                  <span className="block body-6 text-ink-2">{st.b}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {draftType ? (
              <Link href="/list-your-property?start=1" className="btn-primary button-md h-12 px-6!">
                Continue your listing
              </Link>
            ) : (
              <button type="button" onClick={() => openListProperty()} className="btn-primary button-md h-12 px-6!">
                <PlusIcon className="size-4" strokeWidth={2.25} /> List your first property
              </button>
            )}
            <Link href="/list-your-property#features" className="focus-ring rounded body-4 text-ink underline underline-offset-4 hover:text-brand">
              See what you get
            </Link>
          </div>
        </div>
        <div className="relative hidden bg-sand lg:block">
          <Image src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80" alt="" fill sizes="40vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Properties ---------------- */

export function PropertiesView() {
  return (
    <OwnerReady>
      <Properties />
    </OwnerReady>
  );
}

function Properties() {
  const { listings, requests, tickets, ledger, reload } = useOwnerData();
  const [notice, setNotice] = useState("");
  const today = todayISO();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Properties" intro={`${listings.length} ${listings.length === 1 ? "home is" : "homes are"} live in search.`} action={<AddPropertyButton />} />
      <Notice text={notice} />
      {listings.length === 0 ? (
        <Empty icon={<HomeIcon className="size-6" />} title="No properties yet" body="List your first home in about ten minutes. It goes live in search as soon as you publish." action={<AddPropertyButton label="List your first property" />} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {listings.map((l) => (
            <PropertyCard
              key={l.id}
              l={l}
              occ={occupancy([l], requests, today).rate}
              earned={ledger.filter((e) => e.listingId === l.id && e.amount > 0 && e.status === "paid").reduce((s, e) => s + e.amount, 0)}
              waiting={requests.filter((r) => r.listingId === l.id && r.status === "sent").length}
              openTickets={tickets.filter((t) => t.listingId === l.id && ["pending", "approved", "scheduled"].includes(t.status)).length}
              onRemoved={(msg) => {
                setNotice(msg);
                reload();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PropertyCard({ l, occ, earned, waiting, openTickets, onRemoved }: { l: OwnerListing; occ: number; earned: number; waiting: number; openTickets: number; onRemoved: (m: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
      <div className="relative aspect-[16/9] bg-line">
        <Image src={l.img} alt="" fill unoptimized className="object-cover" />
        <span className="absolute left-4 top-4">
          <Pill tone="good">
            <span aria-hidden className="size-1.5 rounded-full bg-current" /> Live
          </Pill>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="truncate title-3 text-ink">{l.title}</p>
        <p className="caption-2 text-ink-2">
          {l.area}, {l.city} · {money(l.price)} a month · {l.type === "yearly" ? "Lease" : "Furnished"}
        </p>
        <p className="caption-5 text-ink-2">{l.availableFrom && l.availableUntil ? `Open ${pretty(l.availableFrom)} to ${pretty(l.availableUntil)}` : `Listed ${pretty(l.createdAt)}`}</p>
        <dl className="mt-4 grid grid-cols-4 gap-2">
          {[
            ["Booked", `${Math.round(occ * 100)}%`],
            ["Collected", money(earned)],
            ["Requests", String(waiting)],
            ["Tickets", String(openTickets)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-sand px-2 py-2 text-center">
              <dt className="caption-5 text-ink-2">{k}</dt>
              <dd className="title-4 text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/homes/${l.id}`} className="btn-secondary button-sm">
            View listing
          </Link>
          <Link href={`/dashboard/calendar#unit-${l.id}`} className="btn-secondary button-sm">
            Calendar
          </Link>
          <Link href={`/dashboard/service?new=1&unit=${l.id}`} className="btn-secondary button-sm">
            Service
          </Link>
          <button type="button" onClick={() => setConfirm(true)} className="focus-ring ml-auto rounded-lg px-4 py-2 button-sm text-error transition-colors duration-300 ease-base hover:bg-[#fdf1f0]">
            Remove
          </button>
          <Dialog
            open={confirm}
            onClose={() => setConfirm(false)}
            title={`Remove ${l.title}?`}
            description="It leaves search right away. Accepted stays, payments, and service history stay in your records."
            tone="danger"
            submitLabel="Remove listing"
            size="sm"
            busy={busy}
            onConfirm={async () => {
              setBusy(true);
              const r = await send(`/api/listings/${l.id}`, "DELETE");
              setBusy(false);
              setConfirm(false);
              onRemoved(r.error ? "We could not remove that listing. Try again." : `${l.title} was removed from search.`);
            }}
          />
        </div>
      </div>
    </li>
  );
}

/* ---------------- Settings ---------------- */

export function SettingsView() {
  return (
    <OwnerReady>
      <Settings />
    </OwnerReady>
  );
}

function Settings() {
  const { user, vendors } = useOwnerData();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  if (!user) return null;
  const since = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const cleaner = vendors.find((v) => v.defaultCleaner);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" intro="Your account, payments, and how jobs are dispatched." />
      <Card title="Profile">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-full bg-brand subhead text-paper" aria-hidden>
              {initials(user.name)}
            </span>
            <div>
              <p className="heading-3 text-ink">{user.name}</p>
              <p className="body-6 text-ink-2">
                {user.email} · Owner since {since}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={leaving}
            onClick={async () => {
              setLeaving(true);
              await logout();
              router.push("/");
            }}
            className="btn-secondary button-sm"
          >
            {leaving ? "Logging out" : "Log out"}
          </button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="How renters pay">
          <ul className="flex flex-col gap-2 body-6 text-ink-2">
            <li>
              <span className="text-ink">Furnished stays:</span> card, charged monthly from move in.
            </li>
            <li>
              <span className="text-ink">Leases:</span> ACH autopay on the move in day each month.
            </li>
            <li>Deposits and one time fees are charged with the first payment.</li>
          </ul>
          <Link href="/dashboard/ledger" className="btn-secondary button-sm mt-4">
            Open ledger
          </Link>
        </Card>
        <Card title="Cleaning dispatch">
          <p className="body-6 text-ink-2">
            {cleaner ? (
              <>
                Move out cleans go to <span className="text-ink">{cleaner.name}</span> after every furnished stay, from 11:00 to 15:00 on move out day.
              </>
            ) : (
              "Add a cleaner and move out cleans are assigned to them after every furnished stay."
            )}
          </p>
          <Link href="/dashboard/team" className="btn-secondary button-sm mt-4">
            {cleaner ? "Change cleaner" : "Add your cleaner"}
          </Link>
        </Card>
      </div>
      <Card title="Need a hand?">
        <p className="max-w-[60ch] body-6 text-ink-2">Answers about payouts, fees, cleaning, repairs, and screening renters are in the owner FAQ.</p>
        <Link href="/list-your-property#faq" className="btn-secondary button-sm mt-4">
          Read the owner FAQ
        </Link>
      </Card>
    </div>
  );
}
