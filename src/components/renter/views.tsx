"use client";

import { METHOD_LABEL } from "@/lib/terms";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "../Dialog";
import { ListingCard } from "../ListingCard";
import { Select } from "../Select";
import { useSaved } from "../saved";
import { initials, logout } from "../session";
import { listings as sampleListings, type Listing } from "@/lib/listings";
import { CalendarIcon, CardIcon, CheckIcon, ClockIcon, HeartIcon, HomeIcon, KeyIcon, SearchIcon, UploadIcon, WrenchIcon } from "../icons";
import { Card, Empty, Field, Notice, PageHeader, Pill, Tabs, fieldCls, money, pretty, todayISO } from "../dashboard-ui";
import { RenterReady, useRenterData, type Repair, type Stay } from "./RenterShell";

const METHOD = METHOD_LABEL;
const DAY = 86_400_000;
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

function StayStatus({ s, today }: { s: Stay; today: string }) {
  if (s.status === "declined") return <Pill>Declined</Pill>;
  if (s.status === "sent")
    return (
      <Pill tone="warn">
        <ClockIcon className="size-3" /> Waiting for owner
      </Pill>
    );
  if (s.endDate <= today) return <Pill>Completed</Pill>;
  if (s.moveIn <= today)
    return (
      <Pill tone="good">
        <KeyIcon className="size-3" /> Living here
      </Pill>
    );
  return (
    <Pill tone="brand">
      <CheckIcon className="size-3" strokeWidth={2.5} /> Confirmed
    </Pill>
  );
}

/* ---------------- Overview ---------------- */

export function RenterOverviewView() {
  return (
    <RenterReady>
      <Overview />
    </RenterReady>
  );
}

function Overview() {
  const { user, stays, payments, repairs } = useRenterData();
  const today = todayISO();
  if (!user) return null;
  const first = user.name.split(/\s+/)[0];
  const home = stays.find((s) => s.status === "accepted" && s.moveIn <= today && s.endDate > today) ?? stays.filter((s) => s.status === "accepted" && s.moveIn > today).sort((a, b) => a.moveIn.localeCompare(b.moveIn))[0];
  const next = payments.find((p) => p.status === "scheduled");
  const late = payments.filter((p) => p.status === "scheduled" && p.due < today);
  const paid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const openRepairs = repairs.filter((r) => ["pending", "approved", "scheduled"].includes(r.status));
  const waiting = stays.filter((s) => s.status === "sent");

  if (stays.length === 0)
    return (
      <Empty
        icon={<HomeIcon className="size-6" />}
        title={`Welcome, ${first}`}
        body="When you request a furnished stay or apply for a lease, you can follow it, pay, and report repairs from here."
        action={
          <Link href="/explore" className="btn-primary button-sm">
            <SearchIcon className="size-4" /> Explore homes
          </Link>
        }
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Hi, ${first}`} intro="Your home, payments, and repairs at a glance." />

      {home ? (
        <HomeCard s={home} today={today} />
      ) : (
        <Card>
          <p className="body-6 text-ink-2">{waiting.length ? `You have ${waiting.length} ${waiting.length === 1 ? "request" : "requests"} waiting for an owner.` : "No upcoming stays."}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/account/payments" className="focus-ring rounded-2xl border border-line/70 bg-paper p-6 shadow-sm transition-shadow duration-300 ease-base hover:shadow-md">
          <span className="flex items-center gap-2 body-5 text-ink-2">
            <CardIcon className="size-4" /> Next payment
          </span>
          <span className="mt-2 block heading-3 text-ink">{next ? money(next.amount) : "None"}</span>
          <span className={`caption-5 ${late.length ? "text-error" : "text-ink-2"}`}>{late.length ? `${late.length} past due` : next ? `Due ${pretty(next.due)}` : `${money(paid)} paid so far`}</span>
        </Link>
        <Link href="/account/repairs" className="focus-ring rounded-2xl border border-line/70 bg-paper p-6 shadow-sm transition-shadow duration-300 ease-base hover:shadow-md">
          <span className="flex items-center gap-2 body-5 text-ink-2">
            <WrenchIcon className="size-4" /> Open repairs
          </span>
          <span className="mt-2 block heading-3 text-ink">{openRepairs.length}</span>
          <span className="caption-5 text-ink-2">{openRepairs.find((r) => r.status === "scheduled") ? "A repair is booked" : "Report one any time"}</span>
        </Link>
        <Link href="/account/stays" className="focus-ring rounded-2xl border border-line/70 bg-paper p-6 shadow-sm transition-shadow duration-300 ease-base hover:shadow-md">
          <span className="flex items-center gap-2 body-5 text-ink-2">
            <HomeIcon className="size-4" /> Requests
          </span>
          <span className="mt-2 block heading-3 text-ink">{waiting.length}</span>
          <span className="caption-5 text-ink-2">Waiting for an owner</span>
        </Link>
      </div>
    </div>
  );
}

function HomeCard({ s, today }: { s: Stay; today: string }) {
  const total = Math.max(days(s.moveIn, s.endDate), 1);
  const done = Math.min(Math.max(days(s.moveIn, today), 0), total);
  const living = s.moveIn <= today;
  return (
    <section aria-label="Your home" className="grid overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm md:grid-cols-[280px_1fr]">
      <div className="relative min-h-44 bg-line">{s.img && <Image src={s.img} alt="" fill unoptimized className="object-cover" />}</div>
      <div className="p-6">
        <StayStatus s={s} today={today} />
        <p className="mt-2 title-1 text-ink">{s.title}</p>
        <p className="caption-2 text-ink-2">
          {s.area ? `${s.area}, ` : ""}
          {s.city} · {s.type === "yearly" ? `${s.months} month lease` : `${s.months} month furnished stay`}
        </p>
        <div className="mt-4">
          <div className="flex justify-between caption-4 text-ink-2">
            <span>Move in {pretty(s.moveIn)}</span>
            <span>Move out {pretty(s.endDate)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-sand" role="progressbar" aria-label="Stay progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
            <div className="h-2 rounded-full bg-brand" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <p className="mt-1 caption-5 text-ink-2">{living ? `${total - done} days left` : (() => {
            const n = days(today, s.moveIn);
            return n === 0 ? "Moving in today" : n === 1 ? "Moving in tomorrow" : `Moving in ${n} days`;
          })()}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/homes/${s.listingId}`} className="btn-secondary button-sm">
            View home
          </Link>
          <Link href="/account/repairs?new=1" className="btn-secondary button-sm">
            <WrenchIcon className="size-4" /> Report a repair
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Stays ---------------- */

export function StaysView() {
  return (
    <RenterReady>
      <Stays />
    </RenterReady>
  );
}

function Stays() {
  const { stays } = useRenterData();
  const today = todayISO();
  type T = "active" | "waiting" | "past";
  const [tab, setTab] = useState<T>("active");
  const pick = (t: T) =>
    stays.filter((s) =>
      t === "active" ? s.status === "accepted" && s.endDate > today : t === "waiting" ? s.status === "sent" : s.status === "declined" || (s.status === "accepted" && s.endDate <= today),
    );
  const rows = pick(tab);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Stays and requests" intro="Furnished stays and leases you have booked or asked for." />
      {stays.length === 0 ? (
        <Empty
          icon={<HomeIcon className="size-6" />}
          title="No requests yet"
          body="Find a home and send a request. You can follow it here."
          action={
            <Link href="/explore" className="btn-primary button-sm">
              Explore homes
            </Link>
          }
        />
      ) : (
        <>
          <Tabs
            label="Filter stays"
            value={tab}
            onChange={setTab}
            options={[
              { value: "active", label: "Upcoming and current", count: pick("active").length },
              { value: "waiting", label: "Waiting", count: pick("waiting").length },
              { value: "past", label: "Past", count: pick("past").length },
            ]}
          />
          {rows.length === 0 ? (
            <p className="rounded-2xl bg-paper px-6 py-10 text-center body-6 text-ink-2 shadow-sm">Nothing here.</p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
              {rows.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4 last:border-b-0">
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-line">{s.img && <Image src={s.img} alt="" fill unoptimized className="object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/homes/${s.listingId}`} className="focus-ring block truncate rounded title-4 text-ink hover:underline hover:underline-offset-4">
                      {s.title}
                    </Link>
                    <span className="block truncate caption-5 text-ink-2">
                      {s.city} · {pretty(s.moveIn)} to {pretty(s.endDate)} · {s.type === "yearly" ? `${s.months} month lease` : `${s.months} months furnished`}
                    </span>
                  </span>
                  <StayStatus s={s} today={today} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Payments ---------------- */

export function RenterPaymentsView() {
  return (
    <RenterReady>
      <Payments />
    </RenterReady>
  );
}

function Payments() {
  const { payments } = useRenterData();
  const today = todayISO();
  const [tab, setTab] = useState<"upcoming" | "paid">("upcoming");
  const upcoming = payments.filter((p) => p.status === "scheduled");
  const paid = payments.filter((p) => p.status === "paid").reverse();
  const late = upcoming.filter((p) => p.due < today);
  const rows = tab === "upcoming" ? upcoming : paid;
  const sum = (l: typeof payments) => l.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payments" intro="Furnished stays are charged to your card each month. Leases pay by ACH autopay on your move in day." />
      {late.length > 0 && <Notice tone="error" text={`${late.length} ${late.length === 1 ? "payment is" : "payments are"} past due (${money(sum(late))}). Contact your owner if you already paid.`} />}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Next payment", upcoming[0] ? money(upcoming[0].amount) : "None", upcoming[0] ? `Due ${pretty(upcoming[0].due)}` : "Nothing scheduled"],
          ["Still to pay", money(sum(upcoming)), `${upcoming.length} scheduled`],
          ["Paid so far", money(sum(paid)), `${paid.length} payments`],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-line/70 bg-paper p-4 shadow-sm">
            <p className="caption-4 text-ink-2">{k}</p>
            <p className="mt-1 heading-3 text-ink">{v}</p>
            <p className="caption-5 text-ink-2">{s}</p>
          </div>
        ))}
      </div>
      {payments.length === 0 ? (
        <Empty icon={<CardIcon className="size-6" />} title="No payments yet" body="Once an owner accepts your request, your rent schedule appears here." />
      ) : (
        <>
          <Tabs
            label="Filter payments"
            value={tab}
            onChange={setTab}
            options={[
              { value: "upcoming", label: "Upcoming", count: upcoming.length },
              { value: "paid", label: "Paid", count: paid.length },
            ]}
          />
          <ul className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
            {rows.length === 0 && <li className="px-6 py-10 text-center body-6 text-ink-2">Nothing here.</li>}
            {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4 last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate body-5 text-ink">{p.label}</span>
                  <span className="block truncate caption-5 text-ink-2">
                    {p.listingTitle} · {METHOD[p.method]} · {p.status === "paid" ? `Paid ${pretty(p.paidAt ?? p.due)}` : `Due ${pretty(p.due)}`}
                  </span>
                </span>
                <span className="body-4 tabular-nums text-ink">{money(p.amount, true)}</span>
                {p.status === "paid" ? (
                  <Pill tone="good">
                    <CheckIcon className="size-3" strokeWidth={2.5} /> Paid
                  </Pill>
                ) : p.due < today ? (
                  <Pill tone="bad">Past due</Pill>
                ) : (
                  <Pill tone="brand">Scheduled</Pill>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ---------------- Repairs ---------------- */

const REPAIR_STATUS: Record<Repair["status"], { label: string; tone: "warn" | "brand" | "good" | "neutral" }> = {
  pending: { label: "Sent to owner", tone: "warn" },
  approved: { label: "Approved, booking a time", tone: "brand" },
  scheduled: { label: "Repair booked", tone: "brand" },
  completed: { label: "Fixed", tone: "good" },
  declined: { label: "Declined by owner", tone: "neutral" },
};
const CATS = [
  ["plumbing", "Plumbing"],
  ["electrical", "Electrical"],
  ["hvac", "Heating and cooling"],
  ["appliance", "Appliances"],
  ["pest", "Pests"],
  ["locks", "Locks and keys"],
  ["cleaning", "Cleaning"],
  ["general", "General repair"],
  ["other", "Something else"],
].map(([value, label]) => ({ value, label }));

export function RepairsView() {
  return (
    <RenterReady>
      <Repairs />
    </RenterReady>
  );
}

function Repairs() {
  const { repairs, repairHomes, reload } = useRenterData();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Repair | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => new URLSearchParams(window.location.search).get("new") && repairHomes.length && setOpen(true), 0);
    return () => window.clearTimeout(id);
  }, [repairHomes.length]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Repairs"
        intro="Report a problem with photos. Your owner approves it and books a time you can see here."
        action={
          repairHomes.length > 0 && (
            <button type="button" onClick={() => setOpen(true)} className="btn-primary button-sm h-10 px-4!">
              <WrenchIcon className="size-4" /> Report a repair
            </button>
          )
        }
      />
      <Notice text={notice} />
      {repairs.length === 0 ? (
        <Empty
          icon={<WrenchIcon className="size-6" />}
          title="No repairs reported"
          body={repairHomes.length ? "Something broken? Report it and your owner gets it right away." : "You can report repairs once an owner accepts your stay or lease."}
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
          {repairs.map((r) => (
            <li key={r.id} className="border-b border-line last:border-b-0">
              <button type="button" onClick={() => setView(r)} className="focus-ring flex w-full flex-wrap items-center gap-4 px-6 py-4 text-left transition-colors duration-300 ease-base hover:bg-sand">
                <span className="min-w-0 flex-1">
                  <span className="block truncate title-4 text-ink">{r.title}</span>
                  <span className="block truncate caption-5 text-ink-2">
                    {r.listingTitle} ·{" "}
                    {r.status === "scheduled" && r.date ? `${r.vendorName ?? "Vendor"} on ${pretty(r.date)}, ${r.window?.replace("-", " to ")}` : `Reported ${pretty(r.createdAt)}`}
                  </span>
                </span>
                <Pill tone={REPAIR_STATUS[r.status].tone}>{REPAIR_STATUS[r.status].label}</Pill>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(view)} onClose={() => setView(null)} title={view?.title ?? ""} description={view?.listingTitle} size="lg" bare>
        {view && (
          <>
            <Pill tone={REPAIR_STATUS[view.status].tone}>{REPAIR_STATUS[view.status].label}</Pill>
            <p className="body-6 text-ink">{view.details}</p>
            {view.status === "scheduled" && view.date && (
              <p className="flex items-center gap-2 rounded-xl bg-sand px-4 py-2 body-6 text-ink">
                <CalendarIcon className="size-4 text-ink-2" /> {view.vendorName} on {pretty(view.date)}, {view.window?.replace("-", " to ")}
              </p>
            )}
            {view.photos.length > 0 && (
              <ul className="flex gap-2">
                {view.photos.map((src, i) => (
                  <li key={src} className="size-24 overflow-hidden rounded-lg bg-line">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked photo */}
                    <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                  </li>
                ))}
              </ul>
            )}
            <ol className="flex flex-col gap-1 border-l-2 border-line pl-4">
              {view.history.map((h, i) => (
                <li key={i} className="caption-5 text-ink-2">
                  <span className="text-ink">{h.text}</span> · {pretty(h.at)}
                </li>
              ))}
            </ol>
          </>
        )}
      </Dialog>

      {open && (
        <ReportDialog
          onClose={() => setOpen(false)}
          onSent={async () => {
            setOpen(false);
            setNotice("Sent. You will see the booked time here once your owner schedules it.");
            await reload();
          }}
        />
      )}
    </div>
  );
}

function ReportDialog({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { repairHomes } = useRenterData();
  const [home, setHome] = useState(repairHomes[0]?.requestId ?? "");
  const [cat, setCat] = useState("plumbing");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Report a repair"
      description="Your owner sees it right away and books a time."
      submitLabel="Send to owner"
      busy={busy}
      onSubmit={async () => {
        const fd = new FormData();
        fd.set("requestId", home);
        fd.set("category", cat);
        fd.set("title", title);
        fd.set("details", details);
        files.forEach((f) => fd.append("photos", f));
        setBusy(true);
        const res = await fetch("/api/service-requests", { method: "POST", body: fd }).catch(() => null);
        setBusy(false);
        if (!res?.ok) {
          const d = (await res?.json().catch(() => ({}))) as { errors?: Record<string, string>; error?: string } | undefined;
          return setErrors(d?.errors ?? { form: d?.error ?? "We could not send that. Try again." });
        }
        onSent();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span id="tr-home" className="title-4 text-ink">
            Home
          </span>
          <div className="mt-1">
            <Select labelId="tr-home" value={home} onChange={setHome} options={repairHomes.map((h) => ({ value: h.requestId, label: h.title, note: h.city }))} invalid={Boolean(errors.requestId)} />
          </div>
          {errors.requestId && <p className="mt-1 caption-5 text-error">{errors.requestId}</p>}
        </div>
        <div>
          <span id="tr-cat" className="title-4 text-ink">
            What is it?
          </span>
          <div className="mt-1">
            <Select labelId="tr-cat" value={cat} onChange={setCat} options={CATS} />
          </div>
        </div>
      </div>
      <Field label="Short title" htmlFor="tr-title" error={errors.title}>
        <input id="tr-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={fieldCls} placeholder="Bathroom faucet is dripping" />
      </Field>
      <Field label="Details" htmlFor="tr-details" error={errors.details}>
        <textarea id="tr-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} className={`${fieldCls} h-auto py-2`} placeholder="Where it is, when it started, and when you are home." />
      </Field>
      <div>
        <span className="title-4 text-ink">Photos</span>
        <label className="mt-1 flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ink-3 px-4 body-6 text-ink-2 focus-within:outline-2 focus-within:outline-brand hover:bg-sand">
          <UploadIcon className="size-5 shrink-0" />
          <span className="truncate">{files.length ? `${files.length} selected` : "Up to 3 JPG, PNG, or WebP photos"}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} />
        </label>
        {errors.photos && <p className="mt-1 caption-5 text-error">{errors.photos}</p>}
      </div>
      {errors.form && (
        <p role="alert" className="caption-5 text-error">
          {errors.form}
        </p>
      )}
    </Dialog>
  );
}

/* ---------------- Saved ---------------- */

export function SavedView() {
  const { ids } = useSaved();
  const [owned, setOwned] = useState<Listing[] | null>(null);
  useEffect(() => {
    fetch("/api/listings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { listings?: Listing[] }) => setOwned(d.listings ?? []))
      .catch(() => setOwned([]));
  }, []);
  const all = [...(owned ?? []), ...sampleListings];
  const homes = ids.map((id) => all.find((l) => l.id === id)).filter((l): l is Listing => Boolean(l));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Saved homes" intro="Homes you saved in this browser." />
      {owned === null ? (
        <div className="h-64 animate-pulse rounded-2xl bg-line" aria-label="Loading saved homes" />
      ) : homes.length === 0 ? (
        <Empty
          icon={<HeartIcon className="size-6" />}
          title="No saved homes"
          body="Tap the heart on any home to keep it here."
          action={
            <Link href="/explore" className="btn-primary button-sm">
              Explore homes
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {homes.map((l) => (
            <li key={l.id}>
              <ListingCard listing={l} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */

export function RenterSettingsView() {
  return (
    <RenterReady>
      <Settings />
    </RenterReady>
  );
}

function Settings() {
  const { user } = useRenterData();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  if (!user) return null;
  const since = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" />
      <Card title="Profile">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-full bg-brand subhead text-paper" aria-hidden>
              {initials(user.name)}
            </span>
            <div>
              <p className="heading-3 text-ink">{user.name}</p>
              <p className="body-6 text-ink-2">
                {user.email} · Renter since {since}
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
      <Card title="How you pay">
        <ul className="flex flex-col gap-2 body-6 text-ink-2">
          <li>
            <span className="text-ink">Furnished stays:</span> card, charged monthly from move in.
          </li>
          <li>
            <span className="text-ink">Leases:</span> ACH autopay on your move in day each month.
          </li>
          <li>Deposits and one time fees are charged with your first payment.</li>
        </ul>
      </Card>
    </div>
  );
}
