"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "../Dialog";
import { DatePicker } from "../DatePicker";
import { Select } from "../Select";
import { PlusIcon, StarIcon, UserIcon } from "../icons";
import { defaultTerms, describeTerms, type PaymentTerms } from "@/lib/terms";
import { TermsFields } from "./TermsFields";
import { initials } from "../session";
import { Empty, Field, Notice, OwnerReady, PageHeader, Pill, Tabs, fieldCls, money, pretty, todayISO } from "./ui";
import { send, useOwnerData, type LedgerEntry, type ReceivedRequest } from "./useOwnerData";

type Stage = "current" | "upcoming" | "applicant" | "past";
type Customer = {
  id: string;
  name: string;
  stage: Stage;
  requests: ReceivedRequest[];
  active?: ReceivedRequest;
  paid: number;
  due: number;
  overdue: number;
  record?: ReceivedRequest["record"];
  manual: boolean;
  contact: { email?: string; phone?: string; notes?: string };
};

const STAGE: Record<Stage, { label: string; tone: "good" | "brand" | "warn" | "neutral" }> = {
  current: { label: "Current tenant", tone: "good" },
  upcoming: { label: "Moving in soon", tone: "brand" },
  applicant: { label: "Applicant", tone: "warn" },
  past: { label: "Past renter", tone: "neutral" },
};

/** Everyone who has rented or applied, built from requests and the ledger. */
export function buildCustomers(requests: ReceivedRequest[], ledger: LedgerEntry[], today: string): Customer[] {
  const by = new Map<string, ReceivedRequest[]>();
  for (const r of requests) by.set(r.renterId, [...(by.get(r.renterId) ?? []), r]);
  return [...by.entries()]
    .map(([id, rs]) => {
      const acc = rs.filter((r) => r.status === "accepted");
      const current = acc.find((r) => r.moveIn <= today && r.endDate > today);
      const upcoming = acc.filter((r) => r.moveIn > today).sort((a, b) => a.moveIn.localeCompare(b.moveIn))[0];
      const stage: Stage = current ? "current" : upcoming ? "upcoming" : rs.some((r) => r.status === "sent") ? "applicant" : "past";
      const mine = ledger.filter((e) => e.renterId === id && e.amount > 0);
      return {
        id,
        name: rs[0].renter,
        stage,
        requests: rs,
        active: current ?? upcoming ?? rs[0],
        paid: mine.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0),
        due: mine.filter((e) => e.status === "scheduled").reduce((s, e) => s + e.amount, 0),
        overdue: mine.filter((e) => e.status === "scheduled" && e.due < today).reduce((s, e) => s + e.amount, 0),
        record: rs[0].record,
        manual: rs[0].source === "owner",
        contact: { email: rs[0].email, phone: rs[0].phone, notes: rs[0].notes },
      };
    })
    .sort((a, b) => ["current", "upcoming", "applicant", "past"].indexOf(a.stage) - ["current", "upcoming", "applicant", "past"].indexOf(b.stage));
}

export function CustomersView() {
  return (
    <OwnerReady>
      <Customers />
    </OwnerReady>
  );
}

function Customers() {
  const { requests, ledger, listings, reload } = useOwnerData();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const today = todayISO();
  const all = buildCustomers(requests, ledger, today);
  const [tab, setTab] = useState<Stage | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const rows = tab === "all" ? all : all.filter((c) => c.stage === tab);
  const n = (s: Stage) => all.filter((c) => c.stage === s).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        intro="Your tenants, guests, and applicants in one place, with their stays, payments, and ratings."
        action={
          <button type="button" onClick={() => setAdding(true)} disabled={!listings.length} className="btn-primary button-sm h-10 px-4!">
            <PlusIcon className="size-4" strokeWidth={2.25} /> Add customer
          </button>
        }
      />
      <Notice text={notice} />
      <div className="grid gap-4 sm:grid-cols-4">
        {(["current", "upcoming", "applicant", "past"] as Stage[]).map((s) => (
          <div key={s} className="rounded-2xl border border-line/70 bg-paper p-4 shadow-sm">
            <p className="caption-4 text-ink-2">{STAGE[s].label}s</p>
            <p className="mt-1 heading-3 text-ink">{n(s)}</p>
          </div>
        ))}
      </div>
      {all.length === 0 ? (
        <Empty
          icon={<UserIcon className="size-6" />}
          title="No customers yet"
          body="Renters show up here when they request a stay. Already have a tenant? Add them and set their payment terms."
          action={
            listings.length > 0 && (
              <button type="button" onClick={() => setAdding(true)} className="btn-primary button-sm">
                Add a customer
              </button>
            )
          }
        />
      ) : (
        <>
          <Tabs
            label="Filter customers"
            value={tab}
            onChange={setTab}
            options={[
              { value: "all", label: "All", count: all.length },
              { value: "current", label: "Current", count: n("current") },
              { value: "upcoming", label: "Upcoming", count: n("upcoming") },
              { value: "applicant", label: "Applicants", count: n("applicant") },
              { value: "past", label: "Past", count: n("past") },
            ]}
          />
          <ul className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
            {rows.map((c) => {
              const expanded = open === c.id;
              return (
                <li key={c.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : c.id)}
                    className="focus-ring grid w-full gap-4 px-6 py-4 text-left transition-colors duration-300 ease-base hover:bg-sand sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand caption-3 text-paper" aria-hidden>
                        {initials(c.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate title-4 text-ink">{c.name}</span>
                        <span className="block truncate caption-5 text-ink-2">
                          {c.active?.title} · {c.active ? `${pretty(c.active.moveIn)} to ${pretty(c.active.endDate)}` : ""}
                        </span>
                      </span>
                    </span>
                    <span>
                      <Pill tone={STAGE[c.stage].tone}>{STAGE[c.stage].label}</Pill>
                    </span>
                    <span className="caption-2 text-ink-2">
                      Paid <span className="text-ink">{money(c.paid)}</span>
                      {c.overdue > 0 ? <span className="text-error"> · {money(c.overdue)} past due</span> : c.due > 0 ? <> · {money(c.due)} to come</> : null}
                    </span>
                    {c.manual ? (
                      <Pill>Added by you</Pill>
                    ) : (
                      <span className="flex items-center gap-1 caption-4 text-ink-2">
                        <StarIcon className="size-3 text-ink" filled />
                        {c.record?.rating ? c.record.rating.toFixed(2) : "New"}
                      </span>
                    )}
                  </button>
                  {expanded && (
                    <div className="grid gap-4 bg-sand px-6 py-4 md:grid-cols-2">
                      <div>
                        <p className="title-5 text-ink-2">Stays and requests with you</p>
                        <ul className="mt-2 flex flex-col gap-2">
                          {c.requests.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-4 py-2">
                              <span className="min-w-0 body-6 text-ink">
                                {r.title} <span className="text-ink-2">· {pretty(r.moveIn)} to {pretty(r.endDate)} · {r.type === "yearly" ? "Lease" : "Furnished"}</span>
                                {r.terms && <span className="block caption-5 text-ink-2">{describeTerms(r.terms)}</span>}
                              </span>
                              <Pill tone={r.status === "accepted" ? "good" : r.status === "sent" ? "warn" : "neutral"}>{r.status === "sent" ? "Waiting" : r.status === "accepted" ? "Accepted" : "Declined"}</Pill>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {c.manual ? (
                        <div>
                          <p className="title-5 text-ink-2">Contact</p>
                          <dl className="mt-2 flex flex-col gap-1 rounded-xl bg-paper px-4 py-2 body-6 text-ink">
                            {c.contact.email && (
                              <div>
                                <dt className="sr-only">Email</dt>
                                <dd>
                                  <a href={`mailto:${c.contact.email}`} className="focus-ring rounded hover:text-brand">
                                    {c.contact.email}
                                  </a>
                                </dd>
                              </div>
                            )}
                            {c.contact.phone && (
                              <div>
                                <dt className="sr-only">Phone</dt>
                                <dd>
                                  <a href={`tel:${c.contact.phone}`} className="focus-ring rounded hover:text-brand">
                                    {c.contact.phone}
                                  </a>
                                </dd>
                              </div>
                            )}
                            {!c.contact.email && !c.contact.phone && <dd className="text-ink-2">No contact details saved.</dd>}
                            {c.contact.notes && <dd className="caption-5 text-ink-2">{c.contact.notes}</dd>}
                          </dl>
                          <Link href={`/dashboard/payments?renter=${c.id}`} className="btn-secondary button-sm mt-4">
                            Payments
                          </Link>
                        </div>
                      ) : (
                      <div>
                        <p className="title-5 text-ink-2">Record on Dwellspan</p>
                        <dl className="mt-2 grid grid-cols-3 gap-2">
                          {[
                            ["Rating", c.record?.rating ? c.record.rating.toFixed(2) : "New"],
                            ["Stays", String(c.record?.stays ?? 0)],
                            ["Late", String(c.record?.latePayments ?? 0)],
                          ].map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-paper px-2 py-2 text-center">
                              <dt className="caption-5 text-ink-2">{k}</dt>
                              <dd className="title-4 text-ink">{v}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link href="/dashboard/requests" className="btn-secondary button-sm">
                            Requests
                          </Link>
                          <Link href={`/dashboard/payments?renter=${c.id}`} className="btn-secondary button-sm">
                            Payments
                          </Link>
                        </div>
                      </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {adding && (
        <AddCustomer
          onClose={() => setAdding(false)}
          onAdded={async (name) => {
            setAdding(false);
            setNotice(`${name} was added. Their payments are scheduled and the dates are blocked on the calendar.`);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function AddCustomer({ onClose, onAdded }: { onClose: () => void; onAdded: (name: string) => void }) {
  const { listings } = useOwnerData();
  const [unit, setUnit] = useState(listings[0]?.id ?? "");
  const listing = listings.find((l) => l.id === unit);
  const type = listing?.type === "yearly" ? "yearly" : "monthly";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [moveIn, setMoveIn] = useState(todayISO());
  const [months, setMonths] = useState("12");
  const [rent, setRent] = useState(String(listing?.price ?? ""));
  const [deposit, setDeposit] = useState(String(listing?.deposit ?? ""));
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState<PaymentTerms>(() => defaultTerms(type));
  const [pastPaid, setPastPaid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const backdated = moveIn < todayISO();

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a customer"
      description="A tenant you found yourself, already living there or moving in soon."
      submitLabel="Add customer"
      size="lg"
      busy={busy}
      onSubmit={async () => {
        setBusy(true);
        const res = await send("/api/customers", "POST", { name, email, phone, listingId: unit, moveIn, months: Number(months), rent: Number(rent), deposit: Number(deposit) || 0, notes, terms, pastPaid });
        setBusy(false);
        if (res.errors || res.error) return setErrors(res.errors ?? { form: res.error ?? "" });
        onAdded(name.trim());
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" htmlFor="ac-name" error={errors.name}>
          <input id="ac-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={fieldCls} placeholder="Jordan Lee" autoComplete="off" />
        </Field>
        <Field label="Email (optional)" htmlFor="ac-email" error={errors.email}>
          <input id="ac-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} placeholder="jordan@example.com" autoComplete="off" />
        </Field>
        <Field label="Phone (optional)" htmlFor="ac-phone">
          <input id="ac-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldCls} placeholder="(512) 555 0134" autoComplete="off" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span id="ac-unit" className="title-4 text-ink">
            Property
          </span>
          <div className="mt-1">
            <Select
              labelId="ac-unit"
              value={unit}
              onChange={(v) => {
                setUnit(v);
                const l = listings.find((x) => x.id === v);
                if (l) {
                  setRent(String(l.price));
                  setDeposit(String(l.deposit ?? ""));
                  setTerms(defaultTerms(l.type === "yearly" ? "yearly" : "monthly"));
                }
              }}
              options={listings.map((l) => ({ value: l.id, label: l.title, note: l.type === "yearly" ? "Lease" : "Furnished" }))}
              invalid={Boolean(errors.listingId)}
            />
          </div>
          {errors.listingId && <p className="mt-1 caption-5 text-error">{errors.listingId}</p>}
        </div>
        <div>
          <span id="ac-move" className="title-4 text-ink">
            Move in
          </span>
          <div className="mt-1">
            <DatePicker labelId="ac-move" value={moveIn} onChange={setMoveIn} min="2015-01-01" allowPast invalid={Boolean(errors.moveIn)} />
          </div>
          {errors.moveIn && <p className="mt-1 caption-5 text-error">{errors.moveIn}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Length in months" htmlFor="ac-months" error={errors.months}>
          <input id="ac-months" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, "").slice(0, 2))} className={fieldCls} />
        </Field>
        <Field label="Rent per month" htmlFor="ac-rent" error={errors.rent}>
          <input id="ac-rent" inputMode="decimal" value={rent} onChange={(e) => setRent(e.target.value.replace(/[^\d.]/g, ""))} className={fieldCls} placeholder="$0" />
        </Field>
        <Field label="Deposit" htmlFor="ac-dep" error={errors.deposit}>
          <input id="ac-dep" inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/\D/g, ""))} className={fieldCls} placeholder="$0" />
        </Field>
      </div>
      <TermsFields idPrefix="ac" value={terms} onChange={setTerms} />
      {backdated && (
        <label className="flex items-start gap-2 body-6 text-ink">
          <input type="checkbox" checked={pastPaid} onChange={(e) => setPastPaid(e.target.checked)} className="mt-1 size-4 accent-[var(--color-brand)]" />
          Payments due before today were already received
        </label>
      )}
      <Field label="Notes (optional)" htmlFor="ac-notes">
        <input id="ac-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className={fieldCls} placeholder="Has a parking spot, prefers text" />
      </Field>
      {errors.form && (
        <p role="alert" className="caption-5 text-error">
          {errors.form}
        </p>
      )}
    </Dialog>
  );
}
