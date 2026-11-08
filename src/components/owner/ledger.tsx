"use client";

import { METHOD_LABEL } from "@/lib/terms";
import { useMemo, useState } from "react";
import { CheckIcon, ClockIcon, DownloadIcon, LedgerIcon, PlusIcon } from "../icons";
import { DatePicker } from "../DatePicker";
import { Dialog } from "../Dialog";
import { Select } from "../Select";
import { ledgerTotals } from "./metrics";
import { Empty, Field, Notice, OwnerReady, PageHeader, Pill, Tabs, downloadCsv, fieldCls, money, monthKey, monthLabel, pretty, todayISO } from "./ui";
import { send, useOwnerData, type LedgerEntry } from "./useOwnerData";

type Tab = "all" | "scheduled" | "paid" | "overdue" | "expense";
const METHOD = METHOD_LABEL;

export function LedgerView() {
  return (
    <OwnerReady>
      <Ledger />
    </OwnerReady>
  );
}

function Ledger() {
  const { listings, ledger, reload } = useOwnerData();
  const today = todayISO();
  const [unit, setUnit] = useState("all");
  const [tab, setTab] = useState<Tab>("all");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "info" | "error" }>({ text: "", tone: "info" });

  const scoped = unit === "all" ? ledger : ledger.filter((e) => e.listingId === unit);
  const match = (e: LedgerEntry) =>
    tab === "all" ||
    (tab === "scheduled" && e.status === "scheduled" && e.amount > 0) ||
    (tab === "paid" && e.status === "paid" && e.amount > 0) ||
    (tab === "overdue" && e.status === "scheduled" && e.amount > 0 && e.due < today) ||
    (tab === "expense" && e.amount < 0);
  const rows = scoped.filter(match);
  const totals = ledgerTotals(scoped, today);

  const groups = useMemo(() => {
    const m = new Map<string, LedgerEntry[]>();
    for (const e of rows) m.set(monthKey(e.due), [...(m.get(monthKey(e.due)) ?? []), e]);
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows]);

  async function toggle(e: LedgerEntry) {
    const res = await send(`/api/ledger/${e.id}`, "PATCH", { status: e.status === "paid" ? "scheduled" : "paid" });
    if (res.error) return setNotice({ text: res.error, tone: "error" });
    await reload();
  }

  function exportCsv() {
    downloadCsv(`dwellspan-ledger-${today}.csv`, [
      ["Date", "Unit", "Renter", "Type", "Description", "Method", "Status", "Amount"],
      ...rows.map((e) => [e.due, e.listingTitle, e.renterName ?? "", e.kind, e.label, METHOD[e.method], e.status, e.amount.toFixed(2)]),
    ]);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ledger"
        intro="Card payments from furnished stays and ACH rent from leases, grouped by unit and month. Export it for your accountant."
        action={
          <>
            <button type="button" onClick={exportCsv} disabled={!rows.length} className="btn-secondary button-sm h-10">
              <DownloadIcon className="size-4" /> Export CSV
            </button>
            <button type="button" onClick={() => setAdding(true)} disabled={!listings.length} className="btn-primary button-sm h-10 px-4!">
              <PlusIcon className="size-4" strokeWidth={2.25} /> Add entry
            </button>
          </>
        }
      />
      <Notice text={notice.text} tone={notice.tone} />
      {adding && (
        <AddEntry
          onClose={() => setAdding(false)}
          onDone={async (text, tone) => {
            setNotice({ text, tone });
            if (tone === "info") {
              setAdding(false);
              await reload();
            }
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Collected", money(totals.collected), "All time"],
          ["Scheduled", money(totals.scheduled), "Still to come"],
          ["Past due", money(totals.overdue), totals.overdue ? "Follow up with renters" : "Nothing late"],
          ["Expenses", money(totals.expenses), "Jobs and costs"],
          ["Net", money(totals.collected - totals.expenses), "Collected minus expenses"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-line/70 bg-paper p-4 shadow-sm">
            <p className="caption-4 text-ink-2">{k}</p>
            <p className={`mt-1 heading-3 ${k === "Past due" && totals.overdue ? "text-error" : "text-ink"}`}>{v}</p>
            <p className="caption-5 text-ink-2">{s}</p>
          </div>
        ))}
      </div>

      {ledger.length === 0 ? (
        <Empty icon={<LedgerIcon className="size-6" />} title="Your ledger is empty" body="Accept a rental request and its rent, fees, and deposit are scheduled here. Add your own expenses any time." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-full sm:w-64">
              <Select ariaLabel="Property" value={unit} onChange={setUnit} size="sm" options={[{ value: "all", label: "All properties" }, ...listings.map((l) => ({ value: l.id, label: l.title }))]} />
            </div>
            <Tabs
              label="Filter entries"
              value={tab}
              onChange={setTab}
              options={[
                { value: "all", label: "All" },
                { value: "scheduled", label: "Scheduled" },
                { value: "paid", label: "Paid" },
                { value: "overdue", label: "Past due" },
                { value: "expense", label: "Expenses" },
              ]}
            />
          </div>
          {groups.length === 0 ? (
            <p className="rounded-2xl bg-paper px-6 py-10 text-center body-6 text-ink-2 shadow-sm">No entries match.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map(([key, list]) => {
                const net = list.reduce((s, e) => s + e.amount, 0);
                return (
                  <section key={key} aria-label={monthLabel(key, true)} className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
                    <header className="flex items-center justify-between bg-sand px-6 py-2">
                      <h2 className="title-4 text-ink">{monthLabel(key, true)}</h2>
                      <p className="caption-4 text-ink-2">
                        Net <span className="text-ink">{money(net, true)}</span>
                      </p>
                    </header>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left">
                        <thead>
                          <tr className="caption-4 text-ink-2">
                            <th scope="col" className="px-6 py-2 font-medium">Date</th>
                            <th scope="col" className="px-2 py-2 font-medium">Description</th>
                            <th scope="col" className="px-2 py-2 font-medium">Unit</th>
                            <th scope="col" className="px-2 py-2 font-medium">Method</th>
                            <th scope="col" className="px-2 py-2 text-right font-medium">Amount</th>
                            <th scope="col" className="px-6 py-2 text-right font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {list.map((e) => {
                            const late = e.status === "scheduled" && e.amount > 0 && e.due < today;
                            return (
                              <tr key={e.id} className="body-6 text-ink">
                                <td className="whitespace-nowrap px-6 py-2">{pretty(e.due, false)}</td>
                                <td className="px-2 py-2">
                                  {e.label}
                                  {e.renterName && <span className="text-ink-2"> · {e.renterName}</span>}
                                </td>
                                <td className="max-w-48 truncate px-2 py-2 text-ink-2">{e.listingTitle}</td>
                                <td className="whitespace-nowrap px-2 py-2 text-ink-2">{METHOD[e.method]}</td>
                                <td className={`whitespace-nowrap px-2 py-2 text-right tabular-nums ${e.amount < 0 ? "text-ink-2" : ""}`}>{money(e.amount, true)}</td>
                                <td className="whitespace-nowrap px-6 py-2 text-right">
                                  {e.amount < 0 ? (
                                    <Pill>Expense</Pill>
                                  ) : (
                                    <button type="button" onClick={() => toggle(e)} className="focus-ring rounded-full" aria-label={`${e.label}, ${e.status === "paid" ? "paid. Mark as scheduled" : "scheduled. Mark as paid"}`}>
                                      {e.status === "paid" ? (
                                        <Pill tone="good">
                                          <CheckIcon className="size-3" strokeWidth={2.5} /> Paid
                                        </Pill>
                                      ) : late ? (
                                        <Pill tone="bad">
                                          <ClockIcon className="size-3" /> Past due
                                        </Pill>
                                      ) : (
                                        <Pill tone="brand">
                                          <ClockIcon className="size-3" /> Scheduled
                                        </Pill>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddEntry({ onDone, onClose }: { onDone: (text: string, tone: "info" | "error") => void; onClose: () => void }) {
  const { listings } = useOwnerData();
  const [unit, setUnit] = useState(listings[0]?.id ?? "");
  const [direction, setDirection] = useState("expense");
  const [date, setDate] = useState(todayISO());
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a ledger entry"
      description="An expense you paid, or income received outside Dwellspan."
      submitLabel="Add to ledger"
      busy={busy}
      onSubmit={async () => {
        setBusy(true);
        const res = await send("/api/ledger", "POST", { listingId: unit, direction, date, label, amount });
        setBusy(false);
        if (res.errors) return setErrors(res.errors);
        if (res.error) return onDone(res.error, "error");
        setErrors({});
        onDone("Entry added.", "info");
      }}
    >
      <div>
        <span id="le-unit" className="title-4 text-ink">
          Property
        </span>
        <div className="mt-1">
          <Select labelId="le-unit" value={unit} onChange={setUnit} options={listings.map((l) => ({ value: l.id, label: l.title }))} />
        </div>
      </div>
      <div>
        <span id="le-dir" className="title-4 text-ink">
          Type
        </span>
        <div className="mt-1">
          <Select labelId="le-dir" value={direction} onChange={setDirection} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} />
        </div>
      </div>
      <div>
        <span id="le-date" className="title-4 text-ink">
          Date
        </span>
        <div className="mt-1">
          <DatePicker labelId="le-date" value={date} onChange={setDate} min="2015-01-01" allowPast invalid={Boolean(errors.date)} />
        </div>
      </div>
      <Field label="Description" htmlFor="le-label" error={errors.label}>
        <input id="le-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} className={fieldCls} placeholder="Replaced smoke detector" />
      </Field>
      <Field label="Amount" htmlFor="le-amt" error={errors.amount}>
        <input id="le-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} className={fieldCls} placeholder="$0" />
      </Field>
    </Dialog>
  );
}
