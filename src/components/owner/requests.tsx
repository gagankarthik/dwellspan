"use client";

import { useState } from "react";
import { Dialog } from "../Dialog";
import { InboxIcon, StarIcon } from "../icons";
import { initials } from "../session";
import { defaultTerms, type PaymentTerms } from "@/lib/terms";
import { TermsFields } from "./TermsFields";
import { AddPropertyButton, Empty, Notice, OwnerReady, PageHeader, Tabs, pretty, todayISO } from "./ui";
import { send, useOwnerData, type ReceivedRequest } from "./useOwnerData";
import { RequestStatus } from "./views";

type Tab = "sent" | "accepted" | "declined" | "all";

export function RequestsView() {
  return (
    <OwnerReady>
      <Requests />
    </OwnerReady>
  );
}

function Requests() {
  const { listings, requests, reload } = useOwnerData();
  const [tab, setTab] = useState<Tab>("sent");
  const [notice, setNotice] = useState<{ text: string; tone: "info" | "error" }>({ text: "", tone: "info" });
  const count = (s: Tab) => (s === "all" ? requests.length : requests.filter((r) => r.status === s).length);
  const rows = tab === "all" ? requests : requests.filter((r) => r.status === tab);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Rental requests" intro="Booking requests and lease applications. See each renter's record before you answer." />
      <Notice text={notice.text} tone={notice.tone} />
      {requests.length === 0 ? (
        <Empty
          icon={<InboxIcon className="size-6" />}
          title="No requests yet"
          body={listings.length ? "You will see requests here the moment a renter asks to book or apply." : "Requests appear here once your first home is live."}
          action={listings.length ? undefined : <AddPropertyButton label="List your first property" />}
        />
      ) : (
        <>
          <Tabs
            label="Filter requests"
            value={tab}
            onChange={setTab}
            options={[
              { value: "sent", label: "Waiting", count: count("sent") },
              { value: "accepted", label: "Accepted", count: count("accepted") },
              { value: "declined", label: "Declined", count: count("declined") },
              { value: "all", label: "All", count: count("all") },
            ]}
          />
          {rows.length === 0 ? (
            <p className="rounded-2xl bg-paper px-6 py-10 text-center body-6 text-ink-2 shadow-sm">Nothing here.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {rows.map((r) => (
                <RequestItem
                  key={r.id}
                  r={r}
                  onDone={async (text, tone = "info") => {
                    setNotice({ text, tone });
                    if (tone === "info") await reload();
                  }}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function RequestItem({ r, onDone }: { r: ReceivedRequest; onDone: (text: string, tone?: "info" | "error") => void }) {
  const [busy, setBusy] = useState<"" | "accepted" | "declined">("");
  const [confirm, setConfirm] = useState<"" | "accepted" | "declined" | "rate">("");
  const [terms, setTerms] = useState<PaymentTerms>(() => defaultTerms(r.type === "yearly" ? "yearly" : "monthly"));
  const rec = r.record;
  const lease = r.type === "yearly";
  const canRate = r.status === "accepted" && !r.rated && r.moveIn <= todayISO();

  async function decide(decision: "accepted" | "declined") {
    setBusy(decision);
    const res = await send(`/api/requests/${r.id}`, "PATCH", decision === "accepted" ? { decision, terms } : { decision });
    setBusy("");
    setConfirm("");
    if (res.error) return onDone(res.error, "error");
    onDone(
      decision === "accepted"
        ? `Accepted. Payments are scheduled in the ledger${lease ? "" : " and the move out clean is booked"}.`
        : `Declined ${r.renter}'s request.`,
    );
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-sm">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RequestStatus status={r.status} />
            <span className="caption-5 text-ink-2">Sent {pretty(r.createdAt)}</span>
          </div>
          <p className="mt-2 title-1 text-ink">
            {r.renter} wants to {lease ? "lease" : "book"} {r.title}
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Move in", pretty(r.moveIn)],
              ["Move out", pretty(r.endDate)],
              ["Length", `${r.months} months`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-sand px-4 py-2">
                <dt className="caption-5 text-ink-2">{k}</dt>
                <dd className="title-4 text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {r.message && <p className="mt-4 max-w-[60ch] rounded-xl border-l-4 border-brand bg-brand-soft/60 px-4 py-2 body-6 text-ink">“{r.message}”</p>}
          {r.status === "sent" && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setConfirm("accepted")} className="btn-primary button-sm h-10 px-6!">
                {lease ? "Accept application" : "Accept booking"}
              </button>
              <button type="button" onClick={() => setConfirm("declined")} className="btn-secondary button-sm h-10">
                Decline
              </button>
            </div>
          )}
          {canRate && (
            <button type="button" onClick={() => setConfirm("rate")} className="btn-secondary button-sm mt-6">
              <StarIcon className="size-4" /> Rate {r.renter}
            </button>
          )}
          <Dialog
            open={confirm === "accepted"}
            onClose={() => setConfirm("")}
            title={`Accept ${r.renter}'s ${lease ? "application" : "booking"}?`}
            description={`${pretty(r.moveIn)} to ${pretty(r.endDate)} at ${r.title}. These dates are then blocked on the calendar.`}
            submitLabel="Accept"
            busy={busy === "accepted"}
            onConfirm={() => decide("accepted")}
          >
            <TermsFields idPrefix={`acc-${r.id}`} value={terms} onChange={setTerms} />
            <ul className="flex list-disc flex-col gap-1 pl-4 caption-2 text-ink-2">
              <li>Rent, your fees, and the deposit are scheduled in the ledger on these terms.</li>
              {!lease && <li>A move out clean is booked for {pretty(r.endDate)}.</li>}
              <li>Overlapping requests for this unit can no longer be accepted.</li>
            </ul>
          </Dialog>
          <Dialog
            open={confirm === "declined"}
            onClose={() => setConfirm("")}
            title={`Decline ${r.renter}'s request?`}
            description="They will see it was declined. This cannot be undone."
            tone="danger"
            submitLabel="Decline"
            size="sm"
            busy={busy === "declined"}
            onConfirm={() => decide("declined")}
          />
          <RateRenter
            open={confirm === "rate"}
            onClose={() => setConfirm("")}
            id={r.id}
            name={r.renter}
            onDone={(t, tone) => {
              if (tone !== "error") setConfirm("");
              onDone(t, tone);
            }}
          />
        </div>

        <aside aria-label={`${r.renter}'s record`} className="rounded-2xl bg-sand p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-brand caption-3 text-paper" aria-hidden>
              {initials(r.renter)}
            </span>
            <div>
              <p className="title-4 text-ink">{r.renter}&apos;s record</p>
              <p className="caption-5 text-ink-2">From owners they rented from on Dwellspan</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Rating", rec?.rating ? rec.rating.toFixed(2) : "New", rec?.ratingCount ? `${rec.ratingCount} ${rec.ratingCount === 1 ? "review" : "reviews"}` : "No reviews"],
              ["Stays", String(rec?.stays ?? 0), "Completed"],
              ["Late", String(rec?.latePayments ?? 0), "Payments"],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-xl bg-paper px-2 py-2 text-center">
                <dt className="caption-5 text-ink-2">{k}</dt>
                <dd className="subhead text-ink">{v}</dd>
                <dd className="caption-5 text-ink-2">{s}</dd>
              </div>
            ))}
          </dl>
          {rec?.reviews.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {rec.reviews.map((rv, i) => (
                <li key={i} className="rounded-xl bg-paper p-2">
                  <p className="flex flex-wrap items-center gap-2 caption-4 text-ink-2">
                    <Stars n={rv.stars} /> {rv.context}
                  </p>
                  {rv.text && <p className="mt-1 caption-5 text-ink">{rv.text}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 caption-5 text-ink-2">No reviews yet. This may be their first stay through Dwellspan.</p>
          )}
        </aside>
      </div>
    </li>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex text-ink" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} className={`size-3 ${i <= n ? "" : "text-line"}`} filled={i <= n} />
      ))}
    </span>
  );
}

function RateRenter({ open, onClose, id, name, onDone }: { open: boolean; onClose: () => void; id: string; name: string; onDone: (t: string, tone?: "info" | "error") => void }) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Rate ${name} as a renter`}
      description="Other owners see your rating when they screen this renter."
      submitLabel="Save rating"
      size="sm"
      busy={busy}
      onSubmit={async () => {
        if (!stars) return setErr("Pick 1 to 5 stars.");
        setBusy(true);
        const res = await send(`/api/requests/${id}/rating`, "POST", { stars, text });
        setBusy(false);
        if (res.error) return setErr(res.error);
        onDone(`Thanks. Your rating helps other owners screen ${name}.`);
      }}
    >
      <fieldset>
        <legend className="title-4 text-ink">Stars</legend>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <label key={i} className="cursor-pointer">
              <input type="radio" name={`stars-${id}`} value={i} checked={stars === i} onChange={() => setStars(i)} className="peer sr-only" />
              <span className="grid size-10 place-items-center rounded-lg text-ink-3 transition-colors duration-300 ease-base hover:bg-sand peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
                <StarIcon className={`size-6 ${i <= stars ? "text-ink" : ""}`} filled={i <= stars} />
                <span className="sr-only">{i} stars</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`rv-${id}`} className="title-4 text-ink">
          A line for other owners (optional)
        </label>
        <textarea id={`rv-${id}`} value={text} onChange={(e) => setText(e.target.value)} maxLength={400} rows={3} className="focus-ring mt-1 w-full rounded-xl border border-line px-4 py-2 body-6 text-ink" />
      </div>
      {err && (
        <p role="alert" className="caption-5 text-error">
          {err}
        </p>
      )}
    </Dialog>
  );
}
