"use client";

import { useState } from "react";
import { Dialog } from "../Dialog";
import { CheckIcon, PlusIcon, SparkleIcon, TeamIcon } from "../icons";
import { initials } from "../session";
import { Select } from "../Select";
import { Empty, Field, Notice, OwnerReady, PageHeader, Pill, fieldCls } from "./ui";
import { send, useOwnerData, type Vendor } from "./useOwnerData";

export const TRADE_LABEL: Record<string, string> = {
  cleaning: "Cleaner",
  handyman: "Handyman",
  plumbing: "Plumber",
  electrical: "Electrician",
  hvac: "Heating and cooling",
  appliance: "Appliance repair",
  pest: "Pest control",
  landscaping: "Landscaping",
  locksmith: "Locksmith",
  other: "Other",
};

export function TeamView() {
  return (
    <OwnerReady>
      <Team />
    </OwnerReady>
  );
}

function Team() {
  const { vendors, tickets, reload } = useOwnerData();
  const [notice, setNotice] = useState<{ text: string; tone: "info" | "error" }>({ text: "", tone: "info" });
  const done = async (text: string, tone: "info" | "error" = "info") => {
    setNotice({ text, tone });
    if (tone === "info") await reload();
  };
  const cleaner = vendors.find((v) => v.defaultCleaner);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team and vendors"
        intro="Add your cleaner once and move out cleans go to them after every furnished stay. Keep repair vendors here to book jobs in one click."
        action={
          <button type="button" onClick={() => setAdding(true)} className="btn-primary button-sm h-10 px-4!">
            <PlusIcon className="size-4" strokeWidth={2.25} /> Add vendor
          </button>
        }
      />
      <Notice text={notice.text} tone={notice.tone} />

      <div className={`flex flex-wrap items-center gap-4 rounded-2xl p-6 ${cleaner ? "border border-line/70 bg-paper shadow-sm" : "border border-brand/30 bg-brand-soft"}`}>
        <span className="grid size-12 place-items-center rounded-xl bg-brand text-paper">
          <SparkleIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="title-3 text-ink">Cleaning on autopilot</p>
          <p className="body-6 text-ink-2">
            {cleaner ? `${cleaner.name} gets every move out clean, 11:00 to 15:00 on move out day.` : "No default cleaner yet. Add a cleaner below and they become the default."}
          </p>
        </div>
        {cleaner && (
          <Pill tone="good">
            <CheckIcon className="size-3" strokeWidth={2.5} /> On
          </Pill>
        )}
      </div>

      {vendors.length === 0 ? (
        <Empty
          icon={<TeamIcon className="size-6" />}
          title="No vendors yet"
          body="Add the people you already trust: your cleaner, a plumber, an electrician, a handyman."
          action={
            <button type="button" onClick={() => setAdding(true)} className="btn-primary button-sm">
              Add your first vendor
            </button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map((v) => (
            <VendorCard key={v.id} v={v} jobs={tickets.filter((t) => t.vendorId === v.id).length} onDone={done} />
          ))}
        </ul>
      )}
      {adding && (
        <AddVendor
          onClose={() => setAdding(false)}
          onDone={async (t, tone) => {
            if (tone !== "error") setAdding(false);
            await done(t, tone);
          }}
          first={!vendors.some((v) => v.trade === "cleaning")}
        />
      )}
    </div>
  );
}

function VendorCard({ v, jobs, onDone }: { v: Vendor; jobs: number; onDone: (t: string, tone?: "info" | "error") => void }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="flex flex-col rounded-2xl border border-line/70 bg-paper p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-sand caption-3 text-ink" aria-hidden>
          {initials(v.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate title-4 text-ink">{v.name}</p>
          <p className="caption-5 text-ink-2">{TRADE_LABEL[v.trade] ?? v.trade}</p>
        </div>
        {v.defaultCleaner && <Pill tone="brand">Default cleaner</Pill>}
      </div>
      <dl className="mt-4 flex flex-col gap-1 caption-2 text-ink-2">
        {v.phone && (
          <div>
            <dt className="sr-only">Phone</dt>
            <dd>
              <a href={`tel:${v.phone}`} className="focus-ring rounded text-ink hover:text-brand">
                {v.phone}
              </a>
            </dd>
          </div>
        )}
        {v.email && (
          <div>
            <dt className="sr-only">Email</dt>
            <dd className="truncate">
              <a href={`mailto:${v.email}`} className="focus-ring rounded text-ink hover:text-brand">
                {v.email}
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt className="sr-only">Jobs</dt>
          <dd>
            {jobs} {jobs === 1 ? "job" : "jobs"} booked
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {v.trade === "cleaning" && !v.defaultCleaner && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await send(`/api/vendors/${v.id}`, "PATCH");
              setBusy(false);
              onDone(r.error ?? `${v.name} now gets move out cleans.`, r.error ? "error" : "info");
            }}
            className="btn-secondary button-sm"
          >
            Make default cleaner
          </button>
        )}
        <button type="button" onClick={() => setConfirm(true)} className="focus-ring ml-auto rounded-lg px-4 py-2 button-sm text-error hover:bg-[#fdf1f0]">
          Remove
        </button>
        <Dialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title={`Remove ${v.name}?`}
          description={v.defaultCleaner ? "They are your default cleaner. New move out cleans will wait for you to assign someone." : "Jobs already booked with them stay as they are."}
          tone="danger"
          submitLabel="Remove"
          size="sm"
          busy={busy}
          onConfirm={async () => {
            setBusy(true);
            const r = await send(`/api/vendors/${v.id}`, "DELETE");
            setBusy(false);
            setConfirm(false);
            onDone(r.error ?? `${v.name} was removed.`, r.error ? "error" : "info");
          }}
        />
      </div>
    </li>
  );
}

function AddVendor({ onDone, onClose, first }: { onDone: (t: string, tone?: "info" | "error") => Promise<void>; onClose: () => void; first: boolean }) {
  const [trade, setTrade] = useState("cleaning");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [def, setDef] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a vendor"
      description="Their contact details stay private to you."
      submitLabel="Add to team"
      busy={busy}
        onSubmit={async () => {
          setBusy(true);
          const r = await send("/api/vendors", "POST", { trade, name, phone, email, defaultCleaner: trade === "cleaning" && def });
          setBusy(false);
          if (r.errors) return setErrors(r.errors);
          if (r.error) return onDone(r.error, "error");
          setErrors({});
          await onDone(`${name} was added to your team.`);
        }}
      >
        <div>
          <span id="av-trade" className="title-4 text-ink">
            Trade
          </span>
          <div className="mt-1">
            <Select labelId="av-trade" value={trade} onChange={setTrade} options={Object.entries(TRADE_LABEL).map(([value, label]) => ({ value, label }))} />
          </div>
        </div>
        <Field label="Name or company" htmlFor="av-name" error={errors.name}>
          <input id="av-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={fieldCls} placeholder="Sparkle Home Cleaning" />
        </Field>
        <Field label="Phone" htmlFor="av-phone" error={errors.phone}>
          <input id="av-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldCls} placeholder="(512) 555 0134" />
        </Field>
        <Field label="Email" htmlFor="av-email" error={errors.email}>
          <input id="av-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} placeholder="hello@example.com" />
        </Field>
        {trade === "cleaning" && (
          <label className="flex items-start gap-2 body-6 text-ink">
            <input type="checkbox" checked={def || first} disabled={first} onChange={(e) => setDef(e.target.checked)} className="mt-1 size-4 accent-[var(--color-brand)]" />
            Send move out cleans to this cleaner{first ? " (your first cleaner becomes the default)" : ""}
          </label>
        )}
    </Dialog>
  );
}
