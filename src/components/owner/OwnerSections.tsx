import { HeroVisual } from "./HeroVisual";
import { StarIcon } from "../icons";
import { Reveal } from "../Reveal";
import { StartListingButton } from "./StartListingButton";
import { FaqList, FaqSchema, type Faq } from "../ui";

/** Everything owners get, shown under the listing intro on /list-your-property. */

const faqs: Faq[] = [
  {
    q: "Can one unit switch between furnished stays and a lease?",
    a: "Yes. Each unit has one calendar. Set a furnished window and a lease start date, and furnished bookings stop before the lease begins. Dates can never overlap.",
  },
  {
    q: "How do I get paid?",
    a: "Furnished stay guests pay by card each month. Leaseholders pay by ACH autopay. Both land in the ledger, grouped by unit and month, ready to export for your accountant.",
  },
  {
    q: "Which fees can I charge?",
    a: "Cleaning, furnishing, early move in, pet rent, parking, and late fees, each with its own amount and schedule. You choose which apply to furnished stays and which apply to leases.",
  },
  {
    q: "How does cleaning dispatch work?",
    a: "Add your cleaner once. When a furnished stay ends, a move out job is sent to them with the unit, time window, and access code.",
  },
  {
    q: "What happens when a tenant reports a repair?",
    a: "The tenant files a ticket with photos. You approve it and assign a vendor, and the tenant sees the booked time. Every ticket stays in the unit history.",
  },
  {
    q: "How do I screen renters?",
    a: "You see each applicant's ratings from past owners and their stay history before you accept a request or a lease application.",
  },
  {
    q: "Can I edit or remove a listing later?",
    a: "You can remove a listing from your account at any time, and it leaves search right away.",
  },
];

const tools: { id: string; title: string; body: string }[] = [
  {
    id: "calendar",
    title: "Never leave a gap",
    body: "Rent furnished while you look for a tenant. Bookings stop on their own before a lease starts.",
  },
  {
    id: "ledger",
    title: "Get paid on time",
    body: "Card payments and ACH rent land in one ledger, ready to export for your accountant.",
  },
  {
    id: "fees",
    title: "Charge the right fees",
    body: "Cleaning, pet rent, parking, and late fees apply on their own by stay type.",
  },
  {
    id: "dispatch",
    title: "Cleaning on autopilot",
    body: "Move out cleans go to your cleaner, and repairs wait for your approval.",
  },
];

export function OwnerSections() {
  return (
    <>
      {/* Dashboard and tools, shown once */}
      <section id="features" aria-labelledby="dash-title" className="scroll-mt-24 rounded-3xl bg-ink p-6 text-paper md:p-12">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <h2 id="dash-title" className="heading-2">
            Run it all from one dashboard
          </h2>
          <p className="max-w-[60ch] body-3 text-muted lg:justify-self-end">
            Swap the booking site, the property manager, and the spreadsheet for one place built for homes that rent by
            the month and by the year.
          </p>
        </div>
        <Reveal className="mt-8">
          <HeroVisual />
        </Reveal>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t) => (
            <li key={t.id}>
              <p className="subhead">{t.title}</p>
              <p className="mt-2 body-6 text-muted">{t.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Renter ratings */}
      <section aria-labelledby="trust-title" className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 id="trust-title" className="heading-2 text-ink">
            Renter ratings and history
          </h2>
          <p className="mt-4 max-w-[60ch] body-3 text-ink-2">
            Owners and renters rate each other after every stay or lease. When someone applies for your unit, you see their
            ratings from past owners, how many stays they have completed, and their payment record.
          </p>
          <p className="mt-4 caption-2 text-ink-3">Sample profile shown.</p>
        </div>
        <Reveal>
          <div className="mx-auto w-full max-w-[440px] rounded-2xl bg-paper p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-brand title-3 text-paper" aria-hidden>
                MO
              </span>
              <div>
                <p className="title-1 text-ink">Marcus Okafor</p>
                <p className="caption-5 text-ink-3">Applying for Unit 7C, 12 month lease</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-2">
              {[
                ["4.92", "Rating"],
                ["5", "Stays"],
                ["0", "Late payments"],
              ].map(([v, k]) => (
                <div key={k} className="rounded-xl bg-sand px-4 py-2">
                  <dt className="caption-5 text-ink-3">{k}</dt>
                  <dd className="subhead text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-6 flex flex-col gap-2">
              {[
                { who: "Owner in Austin, 4 month stay", text: "Left the unit spotless and paid on the 1st every month." },
                { who: "Owner in Seattle, 3 month stay", text: "Easy to reach, flagged a leaking faucet early." },
              ].map((r) => (
                <li key={r.who} className="rounded-xl bg-sand p-4">
                  <p className="flex flex-wrap items-center gap-2 caption-4 text-ink-3">
                    <span className="flex text-ink" aria-label="5 out of 5">
                      {[0, 1, 2, 3, 4].map((n) => (
                        <StarIcon key={n} className="size-3" />
                      ))}
                    </span>
                    {r.who}
                  </p>
                  <p className="mt-2 body-6 text-ink-2">{r.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Owner FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="grid scroll-mt-24 gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <h2 id="faq-title" className="heading-2 text-ink">
          Questions from owners
        </h2>
        <FaqList faqs={faqs} />
      </section>

      {/* Final CTA */}
      <section aria-labelledby="final-title" className="flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-brand p-8 text-paper md:p-12">
        <div>
          <h2 id="final-title" className="heading-2">
            Your next renter is already searching
          </h2>
          <p className="mt-4 max-w-[60ch] body-3 text-paper">
            Publish your home in about ten minutes and it goes live in search right away.
          </p>
        </div>
        <StartListingButton className="focus-ring-dark inline-flex h-12 items-center rounded-lg bg-paper px-6 button-md text-ink transition-[transform,background-color] duration-300 ease-base hover:-translate-y-px hover:bg-sand active:scale-[0.98]">
          List your property
        </StartListingButton>
      </section>
      <FaqSchema faqs={faqs} />
    </>
  );
}
