import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { MonthlyPhone, TenantPhone } from "@/components/Phones";
import { Reveal } from "@/components/Reveal";
import { Container, FaqList, FaqSchema, type Faq } from "@/components/ui";

export const metadata: Metadata = {
  title: "How renting works",
  description:
    "Compare furnished stays and long term leases, see what the renter app does, and get answers about fees, utilities, repairs, and ratings.",
  alternates: { canonical: "/how-it-works" },
};

const faqs: Faq[] = [
  {
    q: "What is the shortest stay I can book?",
    a: "One month. Owners set their own minimum, anywhere from 1 to 11 months for furnished stays. Long term leases run 12 months.",
  },
  {
    q: "Can I move from a furnished stay into a lease?",
    a: "Yes, if the owner offers it. Your payment history and ratings carry into the lease application.",
  },
  {
    q: "Are there fees I will not see until later?",
    a: "No. Every fee the owner sets, from cleaning to pet rent, shows in the price breakdown before you book or sign.",
  },
  {
    q: "Are utilities included?",
    a: "Many furnished stays include utilities and wifi. Use the Utilities included filter, and check each listing for what the rent covers.",
  },
  {
    q: "How do repairs work?",
    a: "Open a ticket in the app and add photos. The owner approves the job, and you see when the technician is booked.",
  },
  {
    q: "How do ratings work?",
    a: "After every stay or lease, owners and renters rate each other. Your ratings follow you to your next application.",
  },
];

const steps = [
  ["Search", "Enter a city, a move in date, and how long you need. Filter for furnished, pets, parking, or a school zone."],
  ["Book or apply", "Book a furnished stay with a card, or apply for a lease and sign it online. Every fee is listed first."],
  ["Move in", "Get your door code or key details in the app, set up rent payments, and report repairs from the same place."],
];

const compare: [string, string, string][] = [
  ["Length", "1 to 11 months", "12 months"],
  ["Furniture", "Fully furnished", "Usually unfurnished"],
  ["Utilities", "Often included", "Usually paid by the tenant"],
  ["How you commit", "Book online", "Apply, then sign the lease in the app"],
  ["How you pay", "Card, charged each month", "ACH autopay from your bank"],
  ["Getting in", "Door code for your dates", "Keys or fob at move in"],
  ["Typical reasons", "Work assignments, relocations, renovations", "Settling into a neighborhood or school zone"],
];

export default function HowItWorks() {
  return (
    <>
      <Nav />
      <main id="main">
        {/* Intro */}
        <section aria-labelledby="page-title" className="bg-sand py-16">
          <Container className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-end">
            <div>
              <h1 id="page-title" className="heading-1 text-ink">
                How renting works
              </h1>
              <p className="mt-4 max-w-[60ch] lead text-ink-2">
                Find a furnished place for a few months or a home to settle into for the year. Search, sign, pay, and
                get help in one app, with every fee shown before you commit.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <Link href="/explore" className="btn-primary button-md">
                <SearchIcon className="size-4" strokeWidth={2.25} /> Search homes
              </Link>
            </div>
          </Container>
        </section>

        {/* Steps */}
        <section aria-labelledby="steps-title" className="py-16">
          <Container className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <h2 id="steps-title" className="heading-2">
              Keys in three steps
            </h2>
            <ol className="flex flex-col">
              {steps.map(([t, b], i) => (
                <li key={t} className="grid grid-cols-[32px_1fr] gap-4 border-b border-line py-6 first:pt-0">
                  <span className="subhead text-brand">{i + 1}</span>
                  <div>
                    <h3 className="subhead text-ink">{t}</h3>
                    <p className="mt-2 max-w-[60ch] body-6 text-ink-2">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* Comparison */}
        <section id="compare" aria-labelledby="compare-title" className="bg-sand py-16">
          <Container className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <h2 id="compare-title" className="heading-2">
                Furnished stay or lease?
              </h2>
              <p className="mt-4 max-w-[60ch] body-3 text-ink-2">
                Both are listed side by side, often for the same home. Here is how they differ.
              </p>
            </div>
            <Reveal className="min-w-0">
              <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
                <table className="w-full min-w-[560px] text-left">
                  <caption className="sr-only">Furnished stays compared with long term leases</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className="w-1/4 px-4 py-4">
                        <span className="sr-only">Detail</span>
                      </th>
                      <th scope="col" className="px-4 py-4 title-3 text-brand">
                        Furnished stay
                      </th>
                      <th scope="col" className="px-4 py-4 title-3 text-ink">
                        Long term lease
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {compare.map(([k, m, y]) => (
                      <tr key={k} className="border-b border-line last:border-0">
                        <th scope="row" className="px-4 py-4 align-top body-5 text-ink">
                          {k}
                        </th>
                        <td className="px-4 py-4 align-top body-6 text-ink-2">{m}</td>
                        <td className="px-4 py-4 align-top body-6 text-ink-2">{y}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td />
                      <td className="px-4 py-4">
                        <Link href="/explore?type=monthly" className="btn-secondary button-sm">
                          See furnished stays
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Link href="/explore?type=yearly" className="btn-secondary button-sm">
                          See leases
                        </Link>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* The renter app */}
        <section id="app" aria-labelledby="app-title" className="overflow-hidden py-16">
          <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 id="app-title" className="heading-2">
                The renter app
              </h2>
              <p className="mt-4 max-w-[60ch] body-3 text-ink-2">
                Once you book or sign, everything about the stay lives in one app. It works the same for a two month stay
                and a two year lease.
              </p>
              <dl className="mt-8 grid max-w-[60ch] gap-6">
                <div>
                  <dt className="title-3 text-ink">Getting in</dt>
                  <dd className="mt-2 body-6 text-ink-2">
                    Furnished stays come with a door code that works from move in to move out. Leaseholders see key
                    handover details.
                  </dd>
                </div>
                <div>
                  <dt className="title-3 text-ink">Paying rent</dt>
                  <dd className="mt-2 body-6 text-ink-2">
                    Card charges for furnished stays, ACH autopay for leases, and a receipt for every payment.
                  </dd>
                </div>
                <div>
                  <dt className="title-3 text-ink">Repairs</dt>
                  <dd className="mt-2 body-6 text-ink-2">
                    Report a problem with photos and see when the technician is booked.
                  </dd>
                </div>
              </dl>
            </div>
            <Reveal>
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
                <MonthlyPhone />
                <div className="sm:mt-16">
                  <TenantPhone />
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="py-16">
          <Container className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <h2 id="faq-title" className="heading-2">
                Renter FAQ
              </h2>
              <p className="mt-4 max-w-[60ch] body-3 text-ink-2">
                Own a rental? Owner questions are on the{" "}
                <Link href="/list-your-property#faq" className="focus-ring rounded text-brand underline underline-offset-4">
                  owner page
                </Link>
                .
              </p>
            </div>
            <FaqList faqs={faqs} />
          </Container>
        </section>

        {/* Closing CTA: same action as the landing hero */}
        <section aria-labelledby="cta-title" className="bg-sand py-16">
          <Container className="flex flex-wrap items-center justify-between gap-6">
            <h2 id="cta-title" className="heading-2">
              Your next home is a search away
            </h2>
            <Link href="/explore" className="btn-primary button-md">
              <SearchIcon className="size-4" strokeWidth={2.25} /> Search homes
            </Link>
          </Container>
        </section>
      </main>
      <Footer />
      <FaqSchema faqs={faqs} />
    </>
  );
}
