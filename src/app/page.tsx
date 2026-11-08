import Image from "next/image";
import Link from "next/link";
import { CityExplorer } from "@/components/CityExplorer";
import { Footer } from "@/components/Footer";
import { HeroSearch } from "@/components/HeroSearch";
import { ArrowIcon } from "@/components/icons";
import { ListingCard } from "@/components/ListingCard";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { TaglineReveal } from "@/components/TaglineReveal";
import { Container } from "@/components/ui";
import { offers } from "@/lib/listingDetails";
import { heroImages, listings } from "@/lib/listings";

/*
 * The landing page stays focused on homes. Sections are separated by
 * background and imagery, never by rules: photo, white, photo, mist, white.
 * Full search lives on /explore, renter details on /how-it-works, owners on /platform.
 */

const featured = [...listings].sort((a, b) => b.rating - a.rating).slice(0, 8);

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <HeroSearch />

        {/* Featured homes */}
        <section aria-labelledby="featured-title" className="py-16">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="featured-title" className="heading-2 text-ink">
                  Our highest rated homes
                </h2>
                <p className="mt-2 max-w-[60ch] body-3 text-ink-2">
                  Every one rated 4.8 or higher by renters who lived there.
                </p>
              </div>
            </div>
            <ul className="mt-8 grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((l) => (
                <li key={l.id}>
                  <ListingCard listing={l} offer={offers[l.id]} />
                </li>
              ))}
            </ul>
            <div className="mt-12 flex justify-center">
              <Link href="/explore" className="btn-primary button-md">
                View all homes <ArrowIcon className="size-4" />
              </Link>
            </div>
          </Container>
        </section>

        {/* Tagline on a photo */}
        <section aria-label="What Dwellspan does" className="relative isolate flex min-h-[70vh] items-center py-16 text-paper">
          <Image src={heroImages.top.src} alt="" fill sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-[rgb(12_18_40/0.78)]" aria-hidden />
          <Container>
            <TaglineReveal
              lines={["Three months for a new job.", "A year near the right school.", "One place to find them both."]}
            />
            <ul className="mx-auto mt-12 grid max-w-4xl gap-8 text-center sm:grid-cols-3">
              {[
                ["The honest math", "Every price includes fees and the utilities you would pay, so a furnished stay and a lease compare fairly."],
                ["Screened once", "One Renter Passport works for a 3 month stay and a 12 month lease. No fee on every application."],
                ["Land, then settle", "Start furnished while you learn the city, then move into a lease nearby with the same profile."],
              ].map(([t, b]) => (
                <li key={t}>
                  <p className="subhead">{t}</p>
                  <p className="mx-auto mt-2 max-w-[32ch] body-6 text-paper">{b}</p>
                </li>
              ))}
            </ul>
            <p className="mt-12 flex flex-wrap justify-center gap-4 text-center">
              <Link
                href="/compare"
                className="focus-ring-dark inline-flex items-center gap-2 rounded-lg bg-paper px-4 py-2 button-md text-ink shadow-lg transition-[transform,background-color] duration-300 ease-base hover:-translate-y-px hover:bg-sand active:scale-[0.98]"
              >
                Furnished or lease? Do the math <ArrowIcon className="size-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="focus-ring-dark inline-flex items-center gap-2 rounded-lg bg-paper px-4 py-2 button-md text-ink shadow-lg transition-[transform,background-color] duration-300 ease-base hover:-translate-y-px hover:bg-sand active:scale-[0.98]"
              >
                See how renting works <ArrowIcon className="size-4" />
              </Link>
            </p>
          </Container>
        </section>

        {/* Cities by state */}
        <section aria-labelledby="cities-title" className="bg-sand py-16">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="cities-title" className="heading-2 text-ink">
                  Find your next neighborhood
                </h2>
                <p className="mt-2 max-w-[60ch] body-3 text-ink-2">Popular cities in every state we serve.</p>
              </div>
            </div>
            <Reveal className="mt-8">
              <CityExplorer />
            </Reveal>
            <p className="mt-12 text-center">
              <Link href="/explore" className="btn-secondary button-md">
                Browse every city <ArrowIcon className="size-4" />
              </Link>
            </p>
          </Container>
        </section>

        {/* Closing CTA for renters */}
        <section aria-labelledby="cta-title" className="py-16">
          <Container>
            <div className="relative isolate flex min-h-96 flex-col items-center justify-center overflow-hidden rounded-3xl px-6 py-16 text-center text-paper">
              <Image src={heroImages.bottom.src} alt="" fill sizes="100vw" className="-z-10 object-cover" />
              <div className="absolute inset-0 -z-10 bg-[rgb(12_18_40/0.62)]" aria-hidden />
              <h2 id="cta-title" className="max-w-[680px] heading-1">
                Your next home is
                <br className="hidden sm:block" /> one search away
              </h2>
              <p className="mt-4 max-w-[52ch] lead text-paper">
                Furnished stays from one month and long term leases, with photos, reviews, and every fee shown up front.
              </p>
              <Link
                href="/explore"
                className="focus-ring-dark mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-paper px-6 button-md text-ink shadow-lg transition-[transform,background-color] duration-300 ease-base hover:-translate-y-px hover:bg-sand active:scale-[0.98]"
              >
                Start exploring <ArrowIcon className="size-4" />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
