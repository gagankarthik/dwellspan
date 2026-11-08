"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertIcon,
  BoltIcon,
  BugIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  DishwasherIcon,
  DropIcon,
  HelpIcon,
  KeyIcon,
  PlusIcon,
  SparkleIcon,
  ThermostatIcon,
  TreeIcon,
  UploadIcon,
  WrenchIcon,
} from "../icons";
import { DatePicker } from "../DatePicker";
import { Dialog } from "../Dialog";
import { Select } from "../Select";
import { Card, Empty, Field, Notice, OwnerReady, PageHeader, Pill, Tabs, fieldCls, money, pretty, todayISO } from "./ui";
import { send, useOwnerData, type Ticket, type Vendor } from "./useOwnerData";

type IconC = (p: { className?: string }) => ReactNode;

export const CATEGORY: Record<string, { label: string; Icon: IconC; trade: string; hint: string }> = {
  cleaning: { label: "Cleaning", Icon: SparkleIcon, trade: "cleaning", hint: "Turnovers, deep cleans" },
  plumbing: { label: "Plumbing", Icon: DropIcon, trade: "plumbing", hint: "Leaks, clogs, water heater" },
  electrical: { label: "Electrical", Icon: BoltIcon, trade: "electrical", hint: "Outlets, lights, breakers" },
  hvac: { label: "Heating and cooling", Icon: ThermostatIcon, trade: "hvac", hint: "AC, furnace, filters" },
  appliance: { label: "Appliances", Icon: DishwasherIcon, trade: "appliance", hint: "Fridge, washer, oven" },
  pest: { label: "Pest control", Icon: BugIcon, trade: "pest", hint: "Ants, mice, inspections" },
  locks: { label: "Locks and keys", Icon: KeyIcon, trade: "locksmith", hint: "Lockouts, rekeying" },
  landscaping: { label: "Landscaping", Icon: TreeIcon, trade: "landscaping", hint: "Lawn, snow, gutters" },
  general: { label: "General repair", Icon: WrenchIcon, trade: "handyman", hint: "Doors, walls, fixtures" },
  other: { label: "Something else", Icon: HelpIcon, trade: "other", hint: "Anything not listed" },
};

const STATUS: Record<Ticket["status"], { label: string; tone: "warn" | "brand" | "good" | "neutral"; Icon: IconC }> = {
  pending: { label: "Waiting for approval", tone: "warn", Icon: AlertIcon },
  approved: { label: "Needs a vendor", tone: "brand", Icon: WrenchIcon },
  scheduled: { label: "Booked", tone: "brand", Icon: CalendarIcon },
  completed: { label: "Done", tone: "good", Icon: CheckIcon },
  declined: { label: "Declined", tone: "neutral", Icon: CloseIcon },
};

const WINDOWS = ["08:00-11:00", "09:00-12:00", "11:00-15:00", "12:00-15:00", "15:00-18:00"].map((v) => ({ value: v, label: v.replace("-", " to ") }));

type Tab = "action" | "scheduled" | "done" | "declined" | "all";
const inTab = (t: Ticket, tab: Tab) =>
  tab === "all" ||
  (tab === "action" && (t.status === "pending" || t.status === "approved")) ||
  (tab === "scheduled" && t.status === "scheduled") ||
  (tab === "done" && t.status === "completed") ||
  (tab === "declined" && t.status === "declined");

export function ServiceView() {
  return (
    <OwnerReady>
      <Service />
    </OwnerReady>
  );
}

type Say = (text: string, tone?: "info" | "error") => void;

function Service() {
  const { listings, tickets, vendors, reload } = useOwnerData();
  const [tab, setTab] = useState<Tab>("action");
  const [notice, setNotice] = useState<{ text: string; tone: "info" | "error" }>({ text: "", tone: "info" });
  const [draft, setDraft] = useState<{ category: string; unit: string } | null>(null);

  // Deep links: ?new=1&unit=<id> opens the form, ?tab= picks a filter.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = window.setTimeout(() => {
      const t = q.get("tab") as Tab | null;
      if (t && ["action", "scheduled", "done", "declined", "all"].includes(t)) setTab(t);
      if (q.get("new")) setDraft({ category: "", unit: q.get("unit") ?? "" });
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const rows = tickets.filter((t) => inTab(t, tab));
  const count = (t: Tab) => tickets.filter((x) => inTab(x, t)).length;
  const say: Say = async (text, tone = "info") => {
    setNotice({ text, tone });
    if (tone === "info") await reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Service requests"
        intro="Cleaning and repairs for every unit. Tenant tickets wait for your approval, then you book a vendor."
        action={
          <button type="button" onClick={() => setDraft({ category: "", unit: "" })} disabled={!listings.length} className="btn-primary button-sm h-10 px-4!">
            <PlusIcon className="size-4" strokeWidth={2.25} /> New service request
          </button>
        }
      />
      <Notice text={notice.text} tone={notice.tone} />

      {listings.length > 0 && (
        <Card title="Request a service">
          <ul className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY).map(([key, c]) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setDraft({ category: key, unit: "" })}
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 body-5 text-ink transition-colors duration-300 ease-base hover:border-brand hover:bg-brand-soft hover:text-brand"
                >
                  <c.Icon className="size-4" /> {c.label}
                </button>
              </li>
            ))}
          </ul>
          {vendors.length === 0 && (
            <p className="mt-4 body-6 text-ink-2">
              Tip:{" "}
              <Link href="/dashboard/team" className="focus-ring rounded text-brand underline underline-offset-4">
                add your vendors
              </Link>{" "}
              to book jobs in one click.
            </p>
          )}
        </Card>
      )}

      {tickets.length === 0 ? (
        <Empty icon={<WrenchIcon className="size-6" />} title="No service requests yet" body="Move out cleans are created when you accept a furnished stay. Tenants can report repairs from their account." />
      ) : (
        <>
          <Tabs
            label="Filter service requests"
            value={tab}
            onChange={setTab}
            options={[
              { value: "action", label: "Needs action", count: count("action") },
              { value: "scheduled", label: "Booked", count: count("scheduled") },
              { value: "done", label: "Done", count: count("done") },
              { value: "declined", label: "Declined", count: count("declined") },
              { value: "all", label: "All", count: count("all") },
            ]}
          />
          {rows.length === 0 ? (
            <p className="rounded-2xl bg-paper px-6 py-10 text-center body-6 text-ink-2 shadow-sm">Nothing here.</p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
              {rows.map((t) => (
                <TicketRow key={t.id} t={t} vendors={vendors} say={say} />
              ))}
            </ul>
          )}
        </>
      )}

      <NewTicketDialog
        initial={draft}
        onClose={() => setDraft(null)}
        onCreated={() => {
          setDraft(null);
          setTab("action");
          say("Service request created. Book a vendor when you are ready.");
        }}
      />
    </div>
  );
}

/** One ticket as a compact row; details and every action live in dialogs. */
function TicketRow({ t, vendors, say }: { t: Ticket; vendors: Vendor[]; say: Say }) {
  const c = CATEGORY[t.category] ?? CATEGORY.other;
  const s = STATUS[t.status];
  const [dialog, setDialog] = useState<"" | "view" | "book" | "done" | "decline">("");
  const [busy, setBusy] = useState(false);

  async function act(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    const res = await send(`/api/service-requests/${t.id}`, "PATCH", body);
    setBusy(false);
    if (res.error) return say(res.error, "error");
    setDialog("");
    say(ok);
  }

  const primary =
    t.status === "pending" ? (
      <button type="button" disabled={busy} onClick={() => act({ action: "approve" }, "Approved. Book a vendor next.")} className="btn-primary button-sm">
        Approve
      </button>
    ) : t.status === "approved" ? (
      <button type="button" onClick={() => setDialog("book")} className="btn-primary button-sm">
        Book vendor
      </button>
    ) : t.status === "scheduled" ? (
      <button type="button" onClick={() => setDialog("done")} className="btn-secondary button-sm">
        Mark done
      </button>
    ) : null;

  return (
    <li className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4 last:border-b-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <c.Icon className="size-5" />
      </span>
      <button type="button" onClick={() => setDialog("view")} className="focus-ring min-w-0 flex-1 rounded text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate title-4 text-ink">{t.title}</span>
          {t.priority === "urgent" && (
            <Pill tone="bad">
              <AlertIcon className="size-3" /> Urgent
            </Pill>
          )}
        </span>
        <span className="block truncate caption-5 text-ink-2">
          {t.listingTitle} ·{" "}
          {t.status === "scheduled" && t.date ? `${t.vendorName}, ${pretty(t.date, false)} ${t.window?.replace("-", " to ")}` : t.reportedBy === "tenant" ? `Reported by ${t.reporterName ?? "tenant"}` : pretty(t.createdAt)}
        </span>
      </button>
      <Pill tone={s.tone}>
        <s.Icon className="size-3" /> {s.label}
      </Pill>
      <span className="flex gap-2">
        {primary}
        <button type="button" onClick={() => setDialog("view")} className="btn-secondary button-sm">
          Details
        </button>
      </span>

      <Dialog open={dialog === "view"} onClose={() => setDialog("")} title={t.title} description={`${t.listingTitle} · ${c.label}`} size="lg" bare>
        <div className="flex flex-wrap gap-2">
          <Pill tone={s.tone}>
            <s.Icon className="size-3" /> {s.label}
          </Pill>
          {t.priority === "urgent" && <Pill tone="bad">Urgent</Pill>}
          {t.source === "move-out" && <Pill>Automatic move out clean</Pill>}
        </div>
        <p className="body-6 text-ink">{t.details}</p>
        {t.photos.length > 0 && (
          <ul className="flex gap-2">
            {t.photos.map((src, i) => (
              <li key={src}>
                <a href={src} target="_blank" rel="noreferrer" className="focus-ring block size-24 overflow-hidden rounded-lg bg-line">
                  {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked photo */}
                  <img src={src} alt={`Photo ${i + 1} for ${t.title}`} className="size-full object-cover" />
                </a>
              </li>
            ))}
          </ul>
        )}
        {t.status === "scheduled" && (
          <p className="flex flex-wrap items-center gap-2 rounded-xl bg-sand px-4 py-2 body-6 text-ink">
            <CalendarIcon className="size-4 text-ink-2" />
            {t.vendorName} · {t.date ? pretty(t.date) : ""} · {t.window?.replace("-", " to ")}
            {t.accessCode ? <span className="text-ink-2">· Access code {t.accessCode}</span> : null}
          </p>
        )}
        {t.cost ? <p className="caption-2 text-ink-2">Cost {money(t.cost, true)}, in the ledger.</p> : null}
        <div>
          <p className="title-5 text-ink-2">History</p>
          <ol className="mt-2 flex flex-col gap-1 border-l-2 border-line pl-4">
            {t.history.map((h, i) => (
              <li key={i} className="caption-5 text-ink-2">
                <span className="text-ink">{h.text}</span> · {new Date(h.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          {primary}
          {t.status === "scheduled" && (
            <button type="button" onClick={() => setDialog("book")} className="btn-secondary button-sm">
              Change booking
            </button>
          )}
          {(t.status === "completed" || t.status === "declined") && (
            <button type="button" disabled={busy} onClick={() => act({ action: "reopen" }, "Reopened.")} className="btn-secondary button-sm">
              Reopen
            </button>
          )}
          {t.status !== "completed" && t.status !== "declined" && (
            <button type="button" onClick={() => setDialog("decline")} className="focus-ring ml-auto rounded-lg px-4 py-2 button-sm text-error hover:bg-[#fdf1f0]">
              Decline
            </button>
          )}
        </div>
      </Dialog>

      <BookDialog key={`b-${t.updatedAt}`} open={dialog === "book"} t={t} vendors={vendors} busy={busy} onClose={() => setDialog("")} onSubmit={(b, msg) => act({ action: "schedule", ...b }, msg)} />
      <DoneDialog key={`d-${t.updatedAt}`} open={dialog === "done"} busy={busy} onClose={() => setDialog("")} onSubmit={(cost) => act({ action: "complete", cost }, cost ? "Done. The cost is in the ledger." : "Marked done.")} />
      <Dialog
        open={dialog === "decline"}
        onClose={() => setDialog("")}
        title="Decline this request?"
        description={t.reportedBy === "tenant" ? `${t.reporterName ?? "Your tenant"} will see it was declined. You can reopen it later.` : "You can reopen it later."}
        tone="danger"
        submitLabel="Decline"
        size="sm"
        busy={busy}
        onConfirm={() => act({ action: "decline" }, "Declined.")}
      />
    </li>
  );
}

function BookDialog({ open, t, vendors, busy, onClose, onSubmit }: { open: boolean; t: Ticket; vendors: Vendor[]; busy: boolean; onClose: () => void; onSubmit: (b: Record<string, string>, msg: string) => void }) {
  const trade = (CATEGORY[t.category] ?? CATEGORY.other).trade;
  const sorted = [...vendors].sort((a, b) => Number(b.trade === trade) - Number(a.trade === trade));
  const [vendorId, setVendorId] = useState(t.vendorId ?? sorted[0]?.id ?? "");
  const [date, setDate] = useState(t.date && t.date >= todayISO() ? t.date : "");
  const [win, setWin] = useState(t.window ?? "09:00-12:00");
  const [code, setCode] = useState(t.accessCode ?? "");
  const [err, setErr] = useState("");

  if (!vendors.length)
    return (
      <Dialog open={open} onClose={onClose} title="Book a vendor" description="You have no vendors yet. Add the people you work with, then book them here." size="sm" bare>
        <Link href="/dashboard/team" className="btn-primary button-sm self-start">
          Add vendors
        </Link>
      </Dialog>
    );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.status === "scheduled" ? "Change booking" : "Book a vendor"}
      description={`${t.title} at ${t.listingTitle}`}
      submitLabel="Confirm booking"
      busy={busy}
      onSubmit={() => {
        if (!vendorId) return setErr("Pick a vendor.");
        if (!date) return setErr("Pick a date.");
        setErr("");
        const v = vendors.find((x) => x.id === vendorId);
        onSubmit({ vendorId, date, window: win, accessCode: code }, `Booked with ${v?.name ?? "your vendor"} on ${pretty(date)}.`);
      }}
    >
      <div>
        <span id={`v-${t.id}`} className="title-4 text-ink">
          Vendor
        </span>
        <div className="mt-1">
          <Select labelId={`v-${t.id}`} value={vendorId} onChange={setVendorId} options={sorted.map((v) => ({ value: v.id, label: v.name, note: v.trade }))} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span id={`d-${t.id}`} className="title-4 text-ink">
            Date
          </span>
          <div className="mt-1">
            <DatePicker labelId={`d-${t.id}`} value={date} onChange={setDate} min={todayISO()} invalid={err === "Pick a date."} placeholder="Pick a date" />
          </div>
        </div>
        <div>
          <span id={`w-${t.id}`} className="title-4 text-ink">
            Time window
          </span>
          <div className="mt-1">
            <Select labelId={`w-${t.id}`} value={win} onChange={setWin} options={WINDOWS} />
          </div>
        </div>
      </div>
      <Field label="Access code (optional)" htmlFor={`c-${t.id}`} hint="Shown to the vendor, never to other renters">
        <input id={`c-${t.id}`} value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} className={fieldCls} placeholder="Lockbox 4821" />
      </Field>
      {err && (
        <p role="alert" className="caption-5 text-error">
          {err}
        </p>
      )}
    </Dialog>
  );
}

function DoneDialog({ open, busy, onClose, onSubmit }: { open: boolean; busy: boolean; onClose: () => void; onSubmit: (cost?: number) => void }) {
  const [cost, setCost] = useState("");
  return (
    <Dialog open={open} onClose={onClose} title="Mark this job done" description="Add what it cost and it goes into the ledger as an expense." submitLabel="Mark done" size="sm" busy={busy} onSubmit={() => onSubmit(cost ? Number(cost) : undefined)}>
      <Field label="Cost (optional)" htmlFor="done-cost">
        <input id="done-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d.]/g, ""))} className={fieldCls} placeholder="$0" />
      </Field>
    </Dialog>
  );
}

function NewTicketDialog({ initial, onClose, onCreated }: { initial: { category: string; unit: string } | null; onClose: () => void; onCreated: () => void }) {
  const { listings } = useOwnerData();
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [seen, setSeen] = useState<typeof initial>(null);

  // Reset the form each time it opens with a new starting point.
  if (initial !== seen) {
    setSeen(initial);
    if (initial) {
      setUnit(listings.some((l) => l.id === initial.unit) ? initial.unit : (listings[0]?.id ?? ""));
      setCategory(initial.category || "general");
      setPriority("normal");
      setTitle("");
      setDetails("");
      setFiles([]);
      setErrors({});
    }
  }

  async function submit() {
    const fd = new FormData();
    fd.set("listingId", unit);
    fd.set("category", category);
    fd.set("priority", priority);
    fd.set("title", title);
    fd.set("details", details);
    files.forEach((f) => fd.append("photos", f));
    setBusy(true);
    const res = await send("/api/service-requests", "POST", fd);
    setBusy(false);
    if (res.errors || res.error) return setErrors(res.errors ?? { form: res.error ?? "" });
    onCreated();
  }

  return (
    <Dialog open={Boolean(initial)} onClose={onClose} title="New service request" submitLabel="Create request" size="lg" busy={busy} onSubmit={submit}>
      <div>
        <span id="nt-unit" className="title-4 text-ink">
          Property
        </span>
        <div className="mt-1">
          <Select labelId="nt-unit" value={unit} onChange={setUnit} options={listings.map((l) => ({ value: l.id, label: l.title, note: l.city }))} invalid={Boolean(errors.listingId)} />
        </div>
        {errors.listingId && <p className="mt-1 caption-5 text-error">{errors.listingId}</p>}
      </div>
      <fieldset>
        <legend className="title-4 text-ink">What do you need?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(CATEGORY).map(([key, c]) => (
            <label key={key} className="cursor-pointer">
              <input type="radio" name="cat" value={key} checked={category === key} onChange={() => setCategory(key)} className="peer sr-only" />
              <span className="flex h-full flex-col items-center gap-1 rounded-xl border border-line p-2 text-center caption-4 text-ink-2 transition-colors duration-300 ease-base hover:bg-sand peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
                <c.Icon className="size-5" />
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Title" htmlFor="nt-title-in" error={errors.title}>
        <input id="nt-title-in" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={fieldCls} placeholder="Kitchen sink is leaking" />
      </Field>
      <Field label="Details" htmlFor="nt-details" error={errors.details}>
        <textarea id="nt-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} className={`${fieldCls} h-auto py-2`} placeholder="Where it is, when it started, anything the vendor should know." />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="title-4 text-ink">Priority</legend>
          <div className="mt-1 flex gap-1 rounded-xl bg-sand p-1">
            {[
              ["low", "Low"],
              ["normal", "Normal"],
              ["urgent", "Urgent"],
            ].map(([v, l]) => (
              <label key={v} className="flex-1 cursor-pointer">
                <input type="radio" name="prio" value={v} checked={priority === v} onChange={() => setPriority(v)} className="peer sr-only" />
                <span className="flex h-10 items-center justify-center rounded-lg body-5 text-ink-2 transition-colors duration-300 ease-base peer-checked:bg-paper peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
                  {l}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <span className="title-4 text-ink">Photos</span>
          <label className="mt-1 flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ink-3 px-4 body-6 text-ink-2 focus-within:outline-2 focus-within:outline-brand hover:bg-sand">
            <UploadIcon className="size-5 shrink-0" />
            <span className="truncate">{files.length ? `${files.length} selected` : "Up to 3 photos"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} />
          </label>
          {errors.photos && <p className="mt-1 caption-5 text-error">{errors.photos}</p>}
        </div>
      </div>
      {errors.form && (
        <p role="alert" className="caption-5 text-error">
          {errors.form}
        </p>
      )}
    </Dialog>
  );
}
