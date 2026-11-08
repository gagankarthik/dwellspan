import Link from "next/link";
import { listings } from "@/lib/listings";
import { Logo } from "./Logo";

const cities = Array.from(new Set(listings.map((l) => l.city))).sort();

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Renters",
    links: [
      { href: "/explore", label: "Find a home" },
      { href: "/explore?type=monthly", label: "Furnished stays" },
      { href: "/explore?type=yearly", label: "Long term leases" },
      { href: "/how-it-works", label: "How renting works" },
      { href: "/how-it-works#faq", label: "Renter FAQ" },
    ],
  },
  {
    title: "Owners",
    links: [
      { href: "/list-your-property", label: "List your property" },
      { href: "/list-your-property#how", label: "How listing works" },
      { href: "/list-your-property#features", label: "Owner tools" },
      { href: "/list-your-property#faq", label: "Owner FAQ" },
    ],
  },
  {
    title: "Cities",
    links: cities.map((c) => ({ href: `/explore?q=${encodeURIComponent(c.split(",")[0])}`, label: c })),
  },
  {
    title: "Company",
    links: [
      { href: "/account", label: "Your rentals" },
      { href: "/dashboard", label: "Owner dashboard" },
      { href: "/brand", label: "Brand guidelines" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

const linkCls =
  "focus-ring rounded body-6 text-ink-2 transition-colors duration-300 ease-base hover:text-ink hover:underline hover:underline-offset-4";

export function Footer() {
  return (
    <footer className="bg-sand">
      <div className="mx-auto w-full max-w-[1760px] px-4 py-16 sm:px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:gap-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-[36ch] body-6 text-ink-2">
              Furnished stays and long term leases in one search. Book or sign, pay rent, and get repairs handled in one
              app.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:contents">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h2 className="title-4 text-ink">{c.title}</h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={linkCls}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="caption-2 text-ink-3">© 2026 Dwellspan. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
              ["/brand", "Brand"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="focus-ring rounded caption-2 text-ink-2 hover:text-ink hover:underline hover:underline-offset-4"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
