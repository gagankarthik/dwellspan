import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { AmenityIcon, AmenityKeyIcon } from "@/components/amenityIcon";
import { ArrowIcon, StarIcon } from "@/components/icons";
import { ListingCard } from "@/components/ListingCard";
import { Nav, NavFallback } from "@/components/Nav";
import { RequestCard } from "@/components/RequestCard";
import { getHome, nearby } from "@/lib/homes";
import { amenitiesOf, amenityLabel, extraFeatures } from "@/lib/amenities";
import { SMOKING_LABEL, UTILITIES, leaseLabel } from "@/lib/listings";
import { offers } from "@/lib/listingDetails";
import { monthlyCost } from "@/lib/costs";

export const metadata: Metadata = { title: "Home details" };

type Params = { params: Promise<{ id: string }> };

export default function HomePage({ params }: Params) {
  return (
    <>
      <Suspense fallback={<NavFallback />}>
        <Nav />
      </Suspense>
      <main id="main">
        <Suspense fallback={<DetailSkeleton />}>
          <HomeDetail params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading home">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-line" />
      <div className="mt-6 grid h-[420px] animate-pulse rounded-2xl bg-line" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-line" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-line" />
      </div>
    </div>
  );
}

const pretty = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

async function HomeDetail({ params }: Params) {
  await connection();
  const { id } = await params;
  const home = await getHome(id);
  if (!home) notFound();
  const more = await nearby(home);
  const lease = home.type === "yearly";
  const offer = home.offer ?? offers[home.id];
  const [first, ...rest] = home.photos;
  const unopt = (src: string) => src.startsWith("/api/");
  const cost = monthlyCost(home);
  const cityName = home.city.split(",")[0];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/explore"
        className="focus-ring inline-flex items-center gap-2 rounded body-5 text-ink-2 hover:text-ink hover:underline hover:underline-offset-4"
      >
        <ArrowIcon className="size-4 rotate-180" /> All homes
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-1 text-ink">{home.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 body-5 text-ink-2">
            {home.reviews ? (
              <span className="flex items-center gap-1 text-ink">
                <StarIcon className="size-4" /> {home.rating.toFixed(2)}
                <span className="text-ink-3">· {home.reviews} reviews</span>
              </span>
            ) : (
              <span className="rounded-full bg-brand-soft px-2 py-1 caption-3 text-brand">New listing</span>
            )}
            <span aria-hidden>·</span>
            <span>
              {home.area}, {home.city}
            </span>
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 body-4 ${lease ? "bg-ink text-paper" : "bg-brand-soft text-brand"}`}>
          {lease ? leaseLabel(home.leaseTerms) : `Furnished stay · ${home.minMonths} month minimum`}
        </span>
      </header>

      {/* Gallery */}
      <div className="mt-6 grid gap-2 md:h-[480px] md:grid-cols-4 md:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-line md:col-span-2 md:row-span-2 md:aspect-auto">
          <Image src={first.src} alt={first.alt} fill priority sizes="(min-width:768px) 50vw, 100vw" unoptimized={unopt(first.src)} className="object-cover" />
        </div>
        {rest.slice(0, 4).map((p) => (
          <div key={p.src} className="relative hidden overflow-hidden rounded-2xl bg-line md:block">
            <Image src={p.src} alt={p.alt} fill sizes="25vw" unoptimized={unopt(p.src)} className="object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="heading-3 text-ink">
              {home.beds === 0 ? "Studio" : `${home.beds} bedroom`} {lease ? "home" : "furnished home"} in {home.area}
            </h2>
            <p className="mt-2 body-3 text-ink-2">
              {home.beds === 0 ? "Studio" : `${home.beds} ${home.beds === 1 ? "bedroom" : "bedrooms"}`} · {home.baths}{" "}
              {home.baths === 1 ? "bathroom" : "bathrooms"} · {home.sqft.toLocaleString("en-US")} sqft
            </p>
          </section>

          {home.highlights.length > 0 && (
            <ul className="mt-8 grid gap-6 rounded-2xl bg-sand p-6 sm:grid-cols-3">
              {home.highlights.map((h) => (
                <li key={h.title}>
                  <p className="title-3 text-ink">{h.title}</p>
                  <p className="mt-2 body-6 text-ink-2">{h.body}</p>
                </li>
              ))}
            </ul>
          )}

          <section aria-labelledby="about-title" className="mt-12">
            <h2 id="about-title" className="subhead text-ink">
              About this home
            </h2>
            <p className="mt-4 max-w-[60ch] body-3 text-ink-2">{home.description}</p>
          </section>

          <section aria-labelledby="offers-title" className="mt-12">
            <h2 id="offers-title" className="subhead text-ink">
              What this place offers
            </h2>
            <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {amenitiesOf(home, home.features).map((k) => (
                <li key={k} className="flex items-center gap-4 body-3 text-ink">
                  <AmenityKeyIcon k={k} className="size-6 shrink-0 text-ink" />
                  {amenityLabel(k)}
                </li>
              ))}
              {home.tags.includes("pets") && (
                <li className="flex items-center gap-4 body-3 text-ink">
                  <AmenityIcon label="Pet friendly" className="size-6 shrink-0 text-ink" />
                  Pet friendly
                </li>
              )}
              {extraFeatures(home.features).map((f) => (
                <li key={f} className="flex items-center gap-4 body-3 text-ink">
                  <AmenityIcon label={f} className="size-6 shrink-0 text-ink" />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="cost-title" className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="cost-title" className="subhead text-ink">
                  What you actually pay each month
                </h2>
                <p className="mt-2 max-w-[60ch] body-6 text-ink-2">
                  {lease
                    ? "Based on a 12 month lease. Rent alone hides the bills that come with an empty home, so we add them."
                    : `Based on a ${Math.max(home.minMonths, 3)} month stay. One time fees are spread across the months you stay.`}
                </p>
              </div>
              <p className="text-right">
                <span className="heading-3 text-ink">${cost.total.toLocaleString("en-US")}</span>
                <span className="body-6 text-ink-2"> / month all in</span>
              </p>
            </div>
            <ul className="mt-4 flex flex-col rounded-2xl bg-sand px-6 py-2">
              {cost.lines.map((x) => (
                <li key={x.label} className="flex justify-between gap-4 border-b border-line py-2 body-6 last:border-0">
                  <span className="text-ink-2">
                    {x.label}
                    {x.estimate && <span className="ml-2 rounded-full bg-paper px-2 py-0.5 caption-3 text-ink-3">Estimate</span>}
                    {x.note && <span className="block caption-5 text-ink-3">{x.note}</span>}
                  </span>
                  <span className="text-ink">${x.amount.toLocaleString("en-US")}</span>
                </li>
              ))}
              {cost.allUtilitiesIncluded && (
                <li className="py-2 caption-5 text-ink-3">Utilities and wifi are included in the rent. Nothing to set up.</li>
              )}
            </ul>
            {cost.estimated && (
              <p className="mt-2 caption-5 text-ink-3">
                Utility estimates use typical bills for a home this size in {cityName}. Your real bills depend on how you live.
              </p>
            )}
            {home.fees.some((f) => /pet/i.test(f.name)) && (
              <p className="mt-2 caption-5 text-ink-3">Pet rent is left out of this total. It only applies if you bring a pet; see Fees below.</p>
            )}
            <Link
              href={`/compare?city=${encodeURIComponent(cityName)}&${lease ? "lease" : "stay"}=${home.id}`}
              className="btn-secondary button-sm mt-4"
            >
              Compare with {lease ? "furnished stays" : "leases"} in {cityName} <ArrowIcon className="size-4" />
            </Link>
          </section>

          <section aria-labelledby="terms-title" className="mt-12">
            <h2 id="terms-title" className="subhead text-ink">
              Rental terms
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["Available", home.availableUntil ? `${pretty(home.availableFrom)} to ${pretty(home.availableUntil)}` : `From ${pretty(home.availableFrom)}`],
                ["Stay", lease ? `Lease lengths: ${(home.leaseTerms.length ? home.leaseTerms : [12]).join(", ")} months` : `${home.minMonths} to 11 months`],
                [
                  "Security deposit",
                  home.deposit ? `$${home.deposit.toLocaleString("en-US")}, ${home.depositRefundable ? "refundable" : "non-refundable"}` : "No deposit",
                ],
                ["Pets", home.petPolicy],
                ["Payment", lease ? "ACH autopay each month" : "Card, charged each month"],
                ["Access", lease ? "Keys at move in" : "Door code for your dates"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-sand px-4 py-4">
                  <dt className="caption-2 text-ink-3">{k}</dt>
                  <dd className="mt-2 body-5 text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {(home.occupants || home.smoking) && (
              <>
                <h3 className="mt-8 title-3 text-ink">House rules</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    home.occupants ? `Up to ${home.occupants} ${home.occupants === 1 ? "person" : "people"}` : "",
                    home.smoking ? SMOKING_LABEL[home.smoking] : "",
                    home.petPolicy,
                  ]
                    .filter(Boolean)
                    .map((r) => (
                      <li key={r} className="rounded-xl bg-sand px-4 py-2 body-6 text-ink">
                        {r}
                      </li>
                    ))}
                </ul>
              </>
            )}
            {home.utilitiesIncluded && home.utilitiesIncluded.length > 0 && (
              <>
                <h3 className="mt-8 title-3 text-ink">Utilities included in rent</h3>
                <p className="mt-2 body-6 text-ink-2">
                  {UTILITIES.filter(([k]) => home.utilitiesIncluded?.includes(k))
                    .map(([, label]) => label)
                    .join(", ")}
                </p>
              </>
            )}
            {home.managedBy && <p className="mt-8 caption-2 text-ink-3">Managed by {home.managedBy}</p>}
            <h3 className="mt-8 title-3 text-ink">Fees</h3>
            {home.fees.length ? (
              <ul className="mt-2 flex flex-col">
                {home.fees.map((f) => (
                  <li key={`${f.name}-${f.amount}`} className="flex justify-between gap-4 border-b border-line py-2 body-6 last:border-0">
                    <span className="text-ink-2">{f.name}</span>
                    <span className="text-ink">
                      ${f.amount.toLocaleString("en-US")}
                      {f.frequency === "monthly" ? " a month" : " one time"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 body-6 text-ink-2">No extra fees. You pay the rent and the deposit shown.</p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RequestCard
            listingId={home.id}
            type={home.type}
            price={home.price}
            minMonths={home.minMonths}
            deposit={home.deposit}
            depositRefundable={home.depositRefundable}
            leaseTerms={home.leaseTerms}
            fees={home.fees}
            availableFrom={home.availableFrom}
            availableUntil={home.availableUntil}
            offer={offer}
            questions={home.questions ?? []}
          />
        </aside>
      </div>

      {more.length > 0 && (
        <section aria-labelledby="more-title" className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="more-title" className="heading-2 text-ink">
              More homes like this
            </h2>
            <Link href="/explore" className="btn-secondary button-sm">
              View all homes
            </Link>
          </div>
          <ul className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((l) => (
              <li key={l.id}>
                <ListingCard listing={l} offer={offers[l.id]} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
