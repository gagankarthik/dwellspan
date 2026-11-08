"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  INCOME_SOURCES,
  MOVE_REASONS,
  PASSPORT_CHECKS,
  PASSPORT_FEE,
  PASSPORT_VALID_DAYS,
  EMPTY_PASSPORT,
  moveReasonLabel,
  type Passport,
  type PassportForm,
  type YesNo,
} from "@/lib/passportTypes";
import { CheckIcon, ClockIcon, KeyIcon } from "../icons";
import { Select } from "../Select";
import { Card, Field, Notice, PageHeader, Pill, fieldCls, pretty } from "../dashboard-ui";
import { RenterReady, useRenterData } from "./RenterShell";

type Form = PassportForm;
const EMPTY = EMPTY_PASSPORT;

/** The renter editable fields of a stored Passport. */
const pick = (p: Passport): Form => Object.fromEntries((Object.keys(EMPTY) as (keyof Form)[]).map((k) => [k, p[k] ?? EMPTY[k]])) as Form;

/** Two pill buttons for a required yes or no answer. */
function YesNoField({ id, label, hint, value, onChange, error }: { id: string; label: string; hint?: string; value: YesNo; onChange: (v: YesNo) => void; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span id={id} className="title-4 text-ink">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-2">
        {(["yes", "no"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`focus-ring h-12 flex-1 rounded-xl border body-6 transition-colors duration-300 ease-base ${
              value === v ? "border-ink bg-ink text-paper" : error ? "border-error bg-paper text-ink" : "border-line bg-paper text-ink hover:border-ink-3"
            }`}
          >
            {v === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
      {hint && !error && <p className="caption-5 text-ink-3">{hint}</p>}
      {error && <p className="caption-5 text-error">{error}</p>}
    </div>
  );
}

export function PassportView() {
  return (
    <RenterReady>
      <PassportPage />
    </RenterReady>
  );
}

function PassportPage() {
  const { user } = useRenterData();
  const router = useRouter();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [verified, setVerified] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ text: string; tone?: "info" | "error" }>({ text: "" });
  const [busy, setBusy] = useState<"" | "save" | "verify">("");

  useEffect(() => {
    let alive = true;
    fetch("/api/passport", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ passport: Passport | null; verified: boolean }>)
      .then((d) => {
        if (!alive) return;
        setPassport(d.passport);
        setVerified(d.verified);
        setForm(d.passport ? pick(d.passport) : { ...EMPTY, legalName: user?.name ?? "" });
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [user]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  async function submit(kind: "save" | "verify") {
    setBusy(kind);
    setNotice({ text: "" });
    try {
      const res = await fetch(kind === "verify" ? "/api/passport/verify" : "/api/passport", {
        method: kind === "verify" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = (await res.json().catch(() => ({}))) as { passport?: Passport; verified?: boolean; errors?: Record<string, string>; error?: string };
      if (!res.ok) {
        if (d.errors) setErrors(d.errors);
        return setNotice({ text: d.error ?? "Check the highlighted fields.", tone: "error" });
      }
      setPassport(d.passport ?? null);
      setVerified(Boolean(d.verified));
      if (kind === "verify") {
        setEditing(false);
        const next = new URLSearchParams(window.location.search).get("next");
        if (next?.startsWith("/homes/")) return router.push(next);
        setNotice({ text: "Your Passport is verified. Every home on Dwellspan can now see it when you apply." });
      } else setNotice({ text: "Saved. Finish verification whenever you are ready." });
    } catch {
      setNotice({ text: "We could not reach the server. Try again.", tone: "error" });
    } finally {
      setBusy("");
    }
  }

  if (!loaded) return <div className="h-96 animate-pulse rounded-2xl bg-line" aria-busy="true" aria-label="Loading your Passport" />;

  const showForm = !verified || editing;
  const contract = form.incomeSource === "contract" || form.moveReason === "travel-nurse";
  const renter = form.yearsRenting > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Renter Passport"
        intro="One screening for every furnished stay and lease on Dwellspan. Verify once, then apply anywhere without paying another application fee."
        action={
          verified && !editing ? (
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary button-sm">
              Edit details
            </button>
          ) : undefined
        }
      />
      <Notice text={notice.text} tone={notice.tone} />

      {verified && passport && !editing && <PassportCard p={passport} />}

      {showForm && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form
            noValidate
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              submit("verify");
            }}
          >
            <Card title="About you">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full legal name" htmlFor="p-name" error={errors.legalName} hint="As it appears on your government ID">
                  <input id="p-name" className={fieldCls} value={form.legalName} onChange={(e) => set("legalName", e.target.value)} autoComplete="name" />
                </Field>
                <Field label="Phone" htmlFor="p-phone" error={errors.phone}>
                  <input id="p-phone" type="tel" className={fieldCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
                </Field>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span id="p-reason" className="title-4 text-ink">
                    Why you are moving
                  </span>
                  <Select labelId="p-reason" value={form.moveReason} onChange={(v) => set("moveReason", v as Form["moveReason"])} options={MOVE_REASONS.map(([value, label]) => ({ value, label }))} />
                </div>
              </div>
            </Card>

            <Card title="Work and income" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span id="p-source" className="title-4 text-ink">
                    Main income
                  </span>
                  <Select labelId="p-source" value={form.incomeSource} onChange={(v) => set("incomeSource", v as Form["incomeSource"])} options={INCOME_SOURCES.map(([value, label]) => ({ value, label }))} />
                </div>
                <Field label="Monthly income before tax" htmlFor="p-income" error={errors.monthlyIncome} hint="Owners only see it as a multiple of their rent">
                  <input
                    id="p-income"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className={fieldCls}
                    value={form.monthlyIncome || ""}
                    onChange={(e) => set("monthlyIncome", Number(e.target.value))}
                    placeholder="9500"
                  />
                </Field>
                <Field label="Employer or agency" htmlFor="p-emp" error={errors.employer}>
                  <input id="p-emp" className={fieldCls} value={form.employer} onChange={(e) => set("employer", e.target.value)} autoComplete="organization" />
                </Field>
                <Field label="Job title" htmlFor="p-job">
                  <input id="p-job" className={fieldCls} value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} autoComplete="organization-title" />
                </Field>
                <Field label="Started this job or contract" htmlFor="p-start" error={errors.employmentStart}>
                  <input id="p-start" type="month" className={fieldCls} value={form.employmentStart} onChange={(e) => set("employmentStart", e.target.value)} />
                </Field>
                <Field
                  label={contract ? "Contract ends" : "Contract ends (if any)"}
                  htmlFor="p-end"
                  error={errors.contractEnd}
                  hint="Travel and contract roles: owners match lease length to this"
                >
                  <input id="p-end" type="month" className={fieldCls} value={form.contractEnd} onChange={(e) => set("contractEnd", e.target.value)} />
                </Field>
              </div>
            </Card>

            <Card title="Where you live now" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City and state" htmlFor="p-city" error={errors.currentCity}>
                  <input id="p-city" className={fieldCls} value={form.currentCity} onChange={(e) => set("currentCity", e.target.value)} placeholder="Denver, CO" autoComplete="address-level2" />
                </Field>
                <Field label="Months at this address" htmlFor="p-months">
                  <input id="p-months" type="number" min={0} max={600} className={fieldCls} value={form.monthsAtAddress || ""} onChange={(e) => set("monthsAtAddress", Number(e.target.value))} />
                </Field>
                <Field label="Years you have rented in total" htmlFor="p-years" hint="0 if this is your first rental">
                  <input id="p-years" type="number" min={0} max={60} className={fieldCls} value={form.yearsRenting} onChange={(e) => set("yearsRenting", Number(e.target.value))} />
                </Field>
                <Field label="Rent you pay now, per month" htmlFor="p-rent" hint="Leave blank if you do not rent now">
                  <input id="p-rent" type="number" min={0} inputMode="numeric" className={fieldCls} value={form.currentRent || ""} onChange={(e) => set("currentRent", Number(e.target.value))} />
                </Field>
                {renter && (
                  <>
                    <Field label="Current landlord or manager" htmlFor="p-ll" error={errors.landlordName} hint="A person or a company">
                      <input id="p-ll" className={fieldCls} value={form.landlordName} onChange={(e) => set("landlordName", e.target.value)} />
                    </Field>
                    <Field label="Their phone or email" htmlFor="p-llc" error={errors.landlordContact} hint="Owners may contact them as a reference">
                      <input id="p-llc" className={fieldCls} value={form.landlordContact} onChange={(e) => set("landlordContact", e.target.value)} />
                    </Field>
                  </>
                )}
                <YesNoField id="p-evict" label="Evicted in the last 7 years?" value={form.evicted} onChange={(v) => set("evicted", v)} error={errors.evicted} hint="The background check confirms this" />
                <YesNoField id="p-broke" label="Broken a lease in the last 7 years?" value={form.brokeLease} onChange={(v) => set("brokeLease", v)} error={errors.brokeLease} hint="A yes is fine; you can explain in your message" />
              </div>
            </Card>

            <Card title="Your household" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="People who will live with you" htmlFor="p-occ" hint="Total, including you">
                  <input id="p-occ" type="number" min={1} max={12} className={fieldCls} value={form.occupants} onChange={(e) => set("occupants", Number(e.target.value))} />
                </Field>
                <Field label="Vehicles that need parking" htmlFor="p-cars">
                  <input id="p-cars" type="number" min={0} max={6} className={fieldCls} value={form.vehicles} onChange={(e) => set("vehicles", Number(e.target.value))} />
                </Field>
                <Field label="Pets" htmlFor="p-pets" hint="Type, breed, and weight. Leave blank if none. Assistance animals are not pets.">
                  <input id="p-pets" className={fieldCls} value={form.pets} onChange={(e) => set("pets", e.target.value)} placeholder="One dog, beagle, 30 lb" />
                </Field>
                <YesNoField id="p-smoke" label="Does anyone smoke or vape?" value={form.smoker} onChange={(v) => set("smoker", v)} error={errors.smoker} />
              </div>
            </Card>

            <Card title="Emergency contact" className="mt-6">
              <p className="-mt-2 mb-4 caption-5 text-ink-3">Shared with an owner only after they accept your request.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Name" htmlFor="p-em" error={errors.emergencyName}>
                  <input id="p-em" className={fieldCls} value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} />
                </Field>
                <Field label="Phone" htmlFor="p-emp2" error={errors.emergencyPhone}>
                  <input id="p-emp2" type="tel" className={fieldCls} value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} />
                </Field>
                <Field label="Relationship" htmlFor="p-emr">
                  <input id="p-emr" className={fieldCls} value={form.emergencyRelation} onChange={(e) => set("emergencyRelation", e.target.value)} placeholder="Sister, friend" />
                </Field>
              </div>
            </Card>

            <Card title="Consent" className="mt-6">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 size-4 accent-[var(--color-brand)]" />
                <span className="body-6 text-ink-2">
                  I authorize Dwellspan and its screening partner to verify my identity and run a soft credit check, a criminal
                  and eviction background check, and an income check. I understand owners I apply to will see the results.
                </span>
              </label>
              {errors.consent && <p className="mt-2 caption-5 text-error">{errors.consent}</p>}
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="submit" disabled={Boolean(busy)} aria-busy={busy === "verify"} className="btn-primary button-sm">
                  {busy === "verify" ? "Verifying" : verified ? "Save and re-verify" : "Verify my Passport"}
                </button>
                <button type="button" disabled={Boolean(busy)} onClick={() => submit("save")} className="btn-secondary button-sm">
                  {busy === "save" ? "Saving" : "Save draft"}
                </button>
                {editing && (
                  <button type="button" onClick={() => setEditing(false)} className="button-sm px-4 text-ink underline underline-offset-4">
                    Cancel
                  </button>
                )}
              </div>
            </Card>
          </form>

          <aside className="flex flex-col gap-4">
            <Card title="Why a Passport">
              <ul className="flex flex-col gap-4 body-6 text-ink-2">
                <li>
                  <span className="block title-4 text-ink">Pay once</span>
                  ${PASSPORT_FEE} one time instead of an application fee on every home.
                </li>
                <li>
                  <span className="block title-4 text-ink">Stays and leases</span>
                  The same profile works for a 3 month furnished stay and a 12 month lease.
                </li>
                <li>
                  <span className="block title-4 text-ink">Good for {PASSPORT_VALID_DAYS} days</span>
                  Long enough to land in a furnished stay and then sign a lease nearby.
                </li>
                <li>
                  <span className="block title-4 text-ink">Faster answers</span>
                  Owners see verified checks right on your request.
                </li>
              </ul>
            </Card>
            <p className="rounded-2xl bg-brand-soft p-4 caption-5 text-brand">
              Beta: the ${PASSPORT_FEE} fee is waived and checks are simulated while we finish our screening partner setup. No
              credit inquiry is made. We never ask for your Social Security number on this page.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function PassportCard({ p }: { p: Passport }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section aria-label="Your verified Passport" className="rounded-2xl bg-ink p-6 text-paper md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="caption-3 text-muted">Dwellspan Renter Passport</p>
            <p className="mt-2 heading-3">{p.legalName}</p>
            <p className="mt-1 body-6 text-muted">
              {moveReasonLabel(p.moveReason)}
              {p.employer ? ` · ${p.jobTitle ? `${p.jobTitle}, ` : ""}${p.employer}` : ""}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 button-sm text-ink">
            <CheckIcon className="size-4 text-brand" strokeWidth={2.5} /> Verified
          </span>
        </div>
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {PASSPORT_CHECKS.map(([k, label, how]) => (
            <li key={k} className="rounded-xl bg-surface-3 p-4">
              <p className="flex items-center gap-2 title-4">
                <CheckIcon className="size-4 text-brand-bright" strokeWidth={2.5} /> {label}
              </p>
              <p className="mt-1 caption-5 text-muted">{how}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex flex-wrap items-center gap-4 caption-4 text-muted">
          {p.verifiedAt && <span>Verified {pretty(p.verifiedAt)}</span>}
          {p.expiresAt && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3" /> Good until {pretty(p.expiresAt)}
            </span>
          )}
        </p>
      </section>
      <aside className="flex flex-col gap-4">
        <Card title="What owners see">
          <ul className="flex flex-col gap-2 body-6 text-ink-2">
            <li>Verified checks and the date they ran</li>
            <li>Why you are moving, your employer, title, and contract dates</li>
            <li>Your income as a multiple of their rent, never the number</li>
            <li>Your rental history and landlord reference</li>
            <li>Household, pets, vehicles, and smoking</li>
            <li>Your emergency contact, only once they accept</li>
          </ul>
          <p className="mt-4 caption-5 text-ink-3">Only owners you send a request to can see your Passport.</p>
        </Card>
        <Link href="/explore" className="btn-primary button-sm">
          <KeyIcon className="size-4" /> Apply to homes
        </Link>
        <Pill tone="brand">Beta: checks are simulated</Pill>
      </aside>
    </div>
  );
}
