"use client";

import { METHOD_LABEL } from "@/lib/terms";
import { useEffect, useState } from "react";
import { CheckIcon, ClockIcon, DownloadIcon, LedgerIcon } from "../icons";
import { Select } from "../Select";
import { SplitBar, SWATCH } from "./charts";
import { addDays } from "./metrics";
import { Card, Empty, Notice, OwnerReady, PageHeader, Pill, Tabs, downloadCsv, money, monthKey, pretty, todayISO } from "./ui";
import { send, useOwnerData, type LedgerEntry } from "./useOwnerData";

type Tab = "due" | "overdue" | "received";
const METHOD = METHOD_LABEL;

export function PaymentsView() {
  return (
    <OwnerReady>
      <Payments />
    </OwnerReady>
  );
}

function Payments() {
  const { ledger, requests, reload } = useOwnerData();
  const today = todayISO();
  const [tab, setTab] = useState<Tab>("due");
  const [renter, setRenter] = useState("all");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "info" | "error" }>({ text: "", tone: "info" });

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("renter");
    const id = window.setTimeout(() => r && setRenter(r), 0);
    return () => window.clearTimeout(id);
  }, []);

  const renters = [...new Map(requests.filter((r) => r.status === "accepted").map((r) => [r.renterId, r.renter])).entries()];
  const income = ledger.filter((e) => e.amount > 0 && (renter === "all" || e.renterId === renter));
  const overdue = income.filter((e) => e.status === "scheduled" && e.due < today);
  const due = income.filter((e) => e.status === "scheduled" && e.due >= today);
  const received = income.filter((e) => e.status === "paid").sort((a, b) => (b.paidAt ?? b.due).localeCompare(a.paidAt ?? a.due));
  const rows = tab === "due" ? due : tab === "overdue" ? overdue : received;
  const sum = (l: LedgerEntry[]) => l.reduce((s, e) => s + e.amount, 0);
  const thisMonth = monthKey(today);
  const next30 = due.filter((e) => e.due <= addDays(today, 30));

  async function mark(e: LedgerEntry, status: "paid" | "scheduled") {
    setBusy(e.id);
    const res = await send(`/api/ledger/${e.id}`, "PATCH", { status });
    setBusy("");
    if (res.error) return setNotice({ text: res.error, tone: "error" });
    setNotice({ text: status === "paid" ? `${money(e.amount, true)} from ${e.renterName ?? "renter"} recorded as received.` : "Moved back to scheduled.", tone: "info" });
    await reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        intro="Rent, fees, and deposits from your renters. Furnished stays pay by card, leases by ACH autopay."
        action={
          <button
            type="button"
            disabled={!income.length}
            onClick={() =>
              downloadCsv(`dwellspan-payments-${today}.csv`, [
                ["Due", "Paid on", "Renter", "Unit", "Description", "Method", "Status", "Amount"],
                ...income.map((e) => [e.due, e.paidAt?.slice(0, 10) ?? "", e.renterName ?? "", e.listingTitle, e.label, METHOD[e.method], e.status, e.amount.toFixed(2)]),
              ])
            }
            className="btn-secondary button-sm h-10"
          >
            <DownloadIcon className="size-4" /> Export CSV
          </button>
        }
      />
      <Notice text={notice.text} tone={notice.tone} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Received this month", money(sum(received.filter((e) => monthKey(e.paidAt ?? e.due) === thisMonth))), `${received.length} payments all time`],
          ["Due in 30 days", money(sum(next30)), `${next30.length} payments`],
          ["Past due", money(sum(overdue)), overdue.length ? `${overdue.length} need follow up` : "Nothing late"],
          ["Still to collect", money(sum(due) + sum(overdue)), "Across every accepted stay"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-line/70 bg-paper p-4 shadow-sm">
            <p className="caption-4 text-ink-2">{k}</p>
            <p className={`mt-1 heading-3 ${k === "Past due" && overdue.length ? "text-error" : "text-ink"}`}>{v}</p>
            <p className="caption-5 text-ink-2">{s}</p>
          </div>
        ))}
      </div>

      {ledger.length === 0 ? (
        <Empty icon={<LedgerIcon className="size-6" />} title="No payments yet" body="Accept a rental request and its rent, fees, and deposit are scheduled here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Tabs
                label="Filter payments"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "due", label: "Upcoming", count: due.length },
                  { value: "overdue", label: "Past due", count: overdue.length },
                  { value: "received", label: "Received", count: received.length },
                ]}
              />
              {renters.length > 0 && (
                <div className="w-full sm:w-56">
                  <Select ariaLabel="Renter" size="sm" value={renter} onChange={setRenter} options={[{ value: "all", label: "All renters" }, ...renters.map(([value, label]) => ({ value, label }))]} />
                </div>
              )}
            </div>
            {rows.length === 0 ? (
              <p className="rounded-2xl bg-paper px-6 py-10 text-center body-6 text-ink-2 shadow-sm">Nothing here.</p>
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
                {rows.slice(0, 60).map((e) => {
                  const late = e.status === "scheduled" && e.due < today;
                  return (
                    <li key={e.id} className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4 last:border-b-0">
                      <span className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-line py-1">
                        <span className="caption-5 uppercase text-ink-2">{new Date(`${e.due}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span>
                        <span className="title-4 leading-none text-ink">{+e.due.slice(8)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate body-5 text-ink">
                          {e.renterName ?? "Manual entry"} · {e.label}
                        </span>
                        <span className="block truncate caption-5 text-ink-2">
                          {e.listingTitle} · {METHOD[e.method]}
                          {e.paidAt ? ` · Received ${pretty(e.paidAt)}` : ""}
                        </span>
                      </span>
                      <span className="body-4 tabular-nums text-ink">{money(e.amount, true)}</span>
                      {e.status === "paid" ? (
                        <span className="flex items-center gap-2">
                          <Pill tone="good">
                            <CheckIcon className="size-3" strokeWidth={2.5} /> Received
                          </Pill>
                          {e.requestId && (
                            <button type="button" disabled={busy === e.id} onClick={() => mark(e, "scheduled")} className="focus-ring rounded caption-4 text-ink-2 underline underline-offset-4 hover:text-ink">
                              Undo
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Pill tone={late ? "bad" : "brand"}>
                            <ClockIcon className="size-3" /> {late ? "Past due" : "Scheduled"}
                          </Pill>
                          <button type="button" disabled={busy === e.id} onClick={() => mark(e, "paid")} className="focus-ring rounded-lg px-2 py-1 caption-3 text-brand transition-colors duration-300 ease-base hover:bg-brand-soft">
                            {busy === e.id ? "Saving" : "Mark received"}
                          </button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <Card title="How renters pay">
              <SplitBar
                parts={[
                  { label: "Card", value: income.filter((e) => e.method === "card").length, fill: SWATCH.paid },
                  { label: "ACH autopay", value: income.filter((e) => e.method === "ach").length, fill: SWATCH.lease },
                ]}
              />
              <p className="mt-4 caption-5 text-ink-2">Number of charges by method, for the renters shown.</p>
            </Card>
            <Card title="Collection rate">
              {(() => {
                const owed = income.filter((e) => e.due < today);
                const got = owed.filter((e) => e.status === "paid");
                const pct = owed.length ? Math.round((sum(got) / sum(owed)) * 100) : 100;
                return (
                  <>
                    <p className="heading-2 text-ink">{pct}%</p>
                    <p className="caption-5 text-ink-2">
                      {money(sum(got))} of {money(sum(owed))} due so far has been received.
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-sand" aria-hidden>
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                  </>
                );
              })()}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
