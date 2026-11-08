import { CalendarIcon, CardIcon, CheckIcon } from "../icons";
import { FaqList, FaqSchema, type Faq } from "../ui";
import { EarningsEstimate } from "./EarningsEstimate";
import { StartListingButton } from "./StartListingButton";

/** Everything under the listing intro on /list-your-property. Kept short on purpose. */

const reasons = [
  {
    Icon: CalendarIcon,
    title: "No empty months",
    body: "Rent furnished while you look for a tenant. One calendar, so stays and leases never overlap.",
  },
  {
    Icon: CheckIcon,
    title: "Renters checked once",
    body: "Applicants carry a Renter Passport with ID, credit, background, and income already verified.",
  },
  {
    Icon: CardIcon,
    title: "Paid on time",
    body: "Card for furnished stays, ACH autopay for leases. Rent arrives the same way either way.",
  },
];

const faqs: Faq[] = [
  {
    q: "Can I remove my listing later?",
    a: "Yes. Remove a listing from your dashboard at any time and it leaves search right away.",
  },
  {
    q: "Can one home do furnished stays and a lease?",
    a: "Yes. Set a furnished window and a lease start date on the same calendar. Furnished bookings stop before the lease begins.",
  },
  {
    q: "How do I screen renters?",
    a: "Each request shows the renter's Passport checks, their income as a multiple of your rent, rental history, and ratings from past owners. You can also add a few questions of your own.",
  },
  {
    q: "How do I get paid?",
    a: "Furnished guests pay by card each month and leaseholders by ACH autopay. Payments are scheduled when you accept a request.",
  },
];

export function OwnerSections() {
  return (
    <>
      <section aria-label="Why owners list on Dwellspan">
        <ul className="grid gap-8 md:grid-cols-3">
          {reasons.map(({ Icon, title, body }) => (
            <li key={title}>
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon className="size-6" />
              </span>
              <h2 className="mt-4 subhead text-ink">{title}</h2>
              <p className="mt-2 max-w-[40ch] body-6 text-ink-2">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="earnings" aria-labelledby="earn-title" className="scroll-mt-24">
        <EarningsEstimate />
      </section>

      <section id="faq" aria-labelledby="faq-title" className="grid scroll-mt-24 gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <h2 id="faq-title" className="heading-2 text-ink">
          Questions
        </h2>
        <FaqList faqs={faqs} />
      </section>

      <section aria-labelledby="final-title" className="flex flex-col items-center rounded-3xl bg-brand px-6 py-16 text-center text-paper">
        <h2 id="final-title" className="heading-2">
          Ready when you are
        </h2>
        <p className="mt-4 max-w-[48ch] body-3 text-paper">Publish in about ten minutes. It goes live in search right away.</p>
        <StartListingButton className="focus-ring-dark mt-8 inline-flex h-12 items-center rounded-lg bg-paper px-6 button-md text-ink transition-[transform,background-color] duration-300 ease-base hover:-translate-y-px hover:bg-sand active:scale-[0.98]">
          List your property
        </StartListingButton>
      </section>
      <FaqSchema faqs={faqs} />
    </>
  );
}
