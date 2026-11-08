"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PASSPORT_FEE } from "@/lib/passportTypes";
import { WarningIcon } from "@phosphor-icons/react";
import { CheckIcon } from "./icons";
import { DatePicker } from "./DatePicker";
import { Select } from "./Select";
import type { Fee } from "@/lib/listings";
import type { ScreeningQuestion } from "@/lib/screening";
import { openAuth, useSession } from "./session";

type Props = {
  listingId: string;
  type: "monthly" | "yearly";
  price: number;
  minMonths: number;
  deposit: number;
  depositRefundable: boolean;
  leaseTerms: number[];
  fees: Fee[];
  availableFrom: string;
  availableUntil?: string;
  offer?: string;
  questions?: ScreeningQuestion[];
};

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const pretty = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export function RequestCard({ listingId, type, price, minMonths, deposit, depositRefundable, leaseTerms, fees, availableFrom, availableUntil, offer, questions = [] }: Props) {
  const { user } = useSession();
  const lease = type === "yearly";
  const [moveIn, setMoveIn] = useState("");
  const terms = leaseTerms.length ? leaseTerms : [12];
  const [months, setMonths] = useState(String(lease ? (terms.includes(12) ? 12 : terms[0]) : Math.max(minMonths, 3)));
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ moveIn?: string; months?: string; form?: string; answers?: string }>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const n = Number(months);
  const [passport, setPassport] = useState<"unknown" | "none" | "draft" | "verified">("unknown");

  useEffect(() => {
    if (user?.role !== "renter") return;
    let alive = true;
    fetch("/api/passport", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ passport: unknown; verified: boolean }>)
      .then((d) => alive && setPassport(d.verified ? "verified" : d.passport ? "draft" : "none"))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return openAuth();
    const missing = Object.fromEntries(questions.filter((q) => q.required && !answers[q.id]?.trim()).map((q) => [q.id, "Please answer this question."]));
    setAnswerErrors(missing);
    if (!moveIn) return setErrors({ moveIn: "Pick a move in date." });
    if (Object.keys(missing).length) return setErrors({ answers: "Answer the owner's questions." });
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, moveIn, months: n, message, answers }),
      });
      const data = (await res.json().catch(() => ({}))) as { errors?: typeof errors; error?: string; answerErrors?: Record<string, string> };
      if (!res.ok) {
        if (res.status === 401) return openAuth();
        if (data.answerErrors) setAnswerErrors(data.answerErrors);
        return setErrors(data.errors ?? { form: data.error ?? "We could not send your request. Try again." });
      }
      setSent(true);
    } catch {
      setErrors({ form: "We could not reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-6 shadow-xl">
        <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
          <CheckIcon className="size-6" strokeWidth={2.25} />
        </span>
        <h2 className="mt-4 subhead text-ink">{lease ? "Application sent" : "Request sent"}</h2>
        <p className="mt-2 body-6 text-ink-2">
          We sent your {lease ? "lease application" : "booking request"} for {pretty(moveIn)} to the owner. Their reply
          will appear in your account. You are not charged until they accept.
        </p>
        <Link href="/account" className="btn-secondary button-sm mt-6">
          View in your account
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-2xl border border-line bg-paper p-6 shadow-xl">
      <p className="text-ink">
        <span className="heading-3">{money(price)}</span>
        <span className="body-6 text-ink-2"> / month</span>
      </p>
      <p className="mt-2 caption-2 text-ink-3">
        {lease ? `Lease of ${terms.join(", ")} months, paid by ACH autopay` : `Furnished, ${minMonths} month minimum, paid by card`}
      </p>

      {offer && (
        <p className="mt-4 rounded-xl bg-brand-soft px-4 py-2 body-5 text-brand">
          <span className="body-4">Offer: </span>
          {offer}
        </p>
      )}

      <div className="mt-6 grid gap-4">
        <div>
          <span id="r-move-label" className="caption-3 text-ink">
            Move in
          </span>
          <div className="mt-2">
            <DatePicker
              id="r-move"
              labelId="r-move-label"
              min={availableFrom}
              max={availableUntil}
              value={moveIn}
              onChange={(v) => {
                setMoveIn(v);
                setErrors((x) => ({ ...x, moveIn: undefined }));
              }}
              invalid={Boolean(errors.moveIn)}
              describedBy={errors.moveIn ? "r-move-err" : "r-move-hint"}
              align="right"
            />
          </div>
          {errors.moveIn ? (
            <p id="r-move-err" className="mt-2 flex items-center gap-2 caption-2 text-error">
              <WarningIcon aria-hidden className="size-4 shrink-0" /> {errors.moveIn}
            </p>
          ) : (
            <p id="r-move-hint" className="mt-2 caption-2 text-ink-3">
              {availableUntil ? `Available ${pretty(availableFrom)} to ${pretty(availableUntil)}` : `Available from ${pretty(availableFrom)}`}
            </p>
          )}
        </div>
        {lease ? (
          <div>
            <span id="r-term-label" className="caption-3 text-ink">
              Lease length
            </span>
            <Select
              className="mt-2"
              labelId="r-term-label"
              value={months}
              onChange={setMonths}
              invalid={Boolean(errors.months)}
              options={terms.map((m) => ({ value: String(m), label: `${m} months` }))}
            />
          </div>
        ) : (
          <div>
            <span id="r-len-label" className="caption-3 text-ink">
              Stay length
            </span>
            <Select
              className="mt-2"
              labelId="r-len-label"
              value={months}
              onChange={setMonths}
              invalid={Boolean(errors.months)}
              options={Array.from({ length: 12 - minMonths }, (_, i) => {
                const m = minMonths + i;
                return { value: String(m), label: `${m} ${m === 1 ? "month" : "months"}` };
              })}
            />
          </div>
        )}
        {questions.length > 0 && (
          <fieldset className="flex flex-col gap-4 rounded-xl bg-sand p-4">
            <legend className="sr-only">Questions from the owner</legend>
            <p className="caption-3 text-ink" aria-hidden>
              Questions from the owner
            </p>
            {questions.map((q) => {
              const err = answerErrors[q.id];
              const setA = (v: string) => {
                setAnswers((a) => ({ ...a, [q.id]: v }));
                setAnswerErrors((e) => ({ ...e, [q.id]: "" }));
              };
              return (
                <div key={q.id}>
                  <p id={`q-${q.id}`} className="body-6 text-ink">
                    {q.text}
                    {!q.required && <span className="text-ink-3"> (optional)</span>}
                  </p>
                  {q.kind === "text" ? (
                    <input
                      aria-labelledby={`q-${q.id}`}
                      aria-invalid={Boolean(err)}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setA(e.target.value.slice(0, 500))}
                      className="focus-ring mt-2 h-10 w-full rounded-lg border border-line bg-paper px-4 body-6 text-ink"
                    />
                  ) : (
                    <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="mt-2 flex flex-wrap gap-2">
                      {(q.kind === "yesno" ? ["Yes", "No"] : (q.options ?? [])).map((o) => {
                        const on = answers[q.id] === o;
                        return (
                          <button
                            key={o}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setA(o)}
                            className={`focus-ring rounded-full border px-4 py-1 caption-3 transition-colors duration-300 ease-base ${
                              on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink"
                            }`}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {err && <p className="mt-1 caption-2 text-error">{err}</p>}
                </div>
              );
            })}
          </fieldset>
        )}
        <div>
          <label htmlFor="r-msg" className="caption-3 text-ink">
            Message to the owner <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea
            id="r-msg"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="Tell them a little about yourself and your move."
            className="focus-ring mt-2 w-full rounded-lg border border-line bg-paper px-4 py-2 body-6 text-ink placeholder:text-ink-3 transition-colors duration-300 ease-base hover:border-ink-3"
          />
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-[#fdf1f0] px-4 py-2 body-6 text-error">
          <WarningIcon aria-hidden className="mt-2 size-4 shrink-0" /> {errors.form}
        </p>
      )}

      {user?.role === "renter" && passport === "verified" && (
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-sand px-4 py-2 body-6 text-ink">
          <CheckIcon className="mt-1 size-4 shrink-0 text-brand" strokeWidth={2.5} />
          <span>
            Applying with your verified Renter Passport. No application fee.
          </span>
        </p>
      )}
      {user?.role === "renter" && (passport === "none" || passport === "draft") && (
        <p className="mt-6 rounded-xl bg-brand-soft px-4 py-2 body-6 text-ink">
          {passport === "draft" ? "Finish your Renter Passport" : "Get a Renter Passport"} so the owner sees verified
          checks with your request. ${PASSPORT_FEE} once, reused on every home.{" "}
          <Link href={`/account/passport?next=/homes/${listingId}`} className="text-brand underline underline-offset-4">
            {passport === "draft" ? "Finish it" : "Start it"}
          </Link>
        </p>
      )}

      <button type="submit" disabled={busy} aria-busy={busy} className="btn-primary button-md mt-6 w-full">
        {busy ? "Sending" : user ? (lease ? "Apply for this lease" : "Request to book") : "Log in to request"}
      </button>
      <p className="mt-2 text-center caption-2 text-ink-3">You will not be charged yet</p>

      <dl className="mt-6 flex flex-col gap-2 body-6">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">{lease ? "Monthly rent" : `${money(price)} × ${n} months`}</dt>
          <dd className="text-ink">{money(lease ? price : price * n)}</dd>
        </div>
        {fees.map((f) => (
          <div key={`${f.name}-${f.amount}`} className="flex justify-between gap-4">
            <dt className="text-ink-2">{f.name}</dt>
            <dd className="text-ink">
              {money(f.amount)}
              {f.frequency === "monthly" ? "/mo" : " once"}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">{depositRefundable ? "Refundable deposit" : "Non-refundable deposit"}</dt>
          <dd className="text-ink">{deposit ? money(deposit) : "None"}</dd>
        </div>
      </dl>
    </form>
  );
}
