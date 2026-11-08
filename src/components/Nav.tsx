"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { listings } from "@/lib/listings";
import { ChevronIcon } from "./icons";
import { Logo } from "./Logo";
import { AuthDialog } from "./AuthDialog";
import { PropertyTypeDialog, openListProperty } from "./PropertyTypeDialog";
import { openAuth, useSession } from "./session";
import { AccountControls } from "./UserMenu";

type Item = { href: string; label: string; note?: string };
type Group = { id: string; label: string; page?: string; items: Item[] };

const cityCounts = Array.from(
  listings.reduce((m, l) => m.set(l.city, (m.get(l.city) ?? 0) + 1), new Map<string, number>()),
).sort(([a], [b]) => a.localeCompare(b));

export const LIST_HREF = "/list-your-property";

const GROUPS: Group[] = [
  {
    id: "find",
    label: "Find a home",
    items: [
      { href: "/explore", label: "All homes", note: "Every listing, any length" },
      { href: "/explore?type=monthly", label: "Furnished stays", note: "1 to 11 months, move in ready" },
      { href: "/explore?type=yearly", label: "Long term leases", note: "12 months, signed in the app" },
    ],
  },
  {
    id: "cities",
    label: "Cities",
    items: cityCounts.map(([city, n]) => ({
      href: `/explore?q=${encodeURIComponent(city.split(",")[0])}`,
      label: city,
      note: `${n} ${n === 1 ? "home" : "homes"}`,
    })),
  },
  {
    id: "renters",
    label: "Renters",
    page: "/how-it-works",
    items: [
      { href: "/how-it-works", label: "How renting works", note: "From search to move in" },
      { href: "/how-it-works#compare", label: "Compare stay types", note: "Furnished stays and leases side by side" },
      { href: "/how-it-works#app", label: "The renter app", note: "Door codes, rent, and repairs" },
      { href: "/how-it-works#faq", label: "Renter FAQ", note: "Fees, utilities, and ratings" },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  const overlay = pathname === "/"; // transparent over the landing hero photo
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const uid = useId();
  const { user } = useSession();

  // Solid once the page has scrolled past a few pixels (no scroll listener needed).
  useEffect(() => {
    const el = sentinel.current;
    if (!overlay || !el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [overlay]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open) document.getElementById(`${uid}-btn-${open}`)?.focus();
      setOpen(null);
      setMobile(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, uid]);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const closeAll = () => {
    setOpen(null);
    setMobile(false);
  };
  const solid = !overlay || scrolled || open !== null || mobile;
  const light = !solid; // white content on the photo
  const groupCurrent = (g: Group) => Boolean(g.page && pathname === g.page);

  const topLink = (active: boolean) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 title-4 transition-colors duration-300 ease-base ${
      light
        ? `focus-ring-dark ${active ? "bg-paper/15 text-paper" : "text-paper/90 hover:bg-paper/10 hover:text-paper"}`
        : `focus-ring ${active ? "bg-sand text-ink" : "text-ink-2 hover:bg-sand hover:text-ink"}`
    }`;

  return (
    <>
      {overlay && <div ref={sentinel} aria-hidden className="pointer-events-none absolute top-0 left-0 h-2 w-px" />}
      <header
        className={`${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-50 border-b transition-colors duration-300 ease-base ${
          solid ? "border-line bg-paper" : "border-transparent bg-transparent"
        }`}
      >
        <nav
          ref={navRef}
          aria-label="Main"
          className="relative z-10 mx-auto flex h-16 w-full max-w-[1760px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-12"
        >
          <div className="flex items-center gap-6">
            <Logo onClick={closeAll} dark={light} />
            <ul className="hidden items-center gap-2 lg:flex">
              {GROUPS.map((g) => {
                const isOpen = open === g.id;
                return (
                  <li key={g.id} className="relative">
                    <button
                      id={`${uid}-btn-${g.id}`}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${uid}-menu-${g.id}`}
                      onClick={() => setOpen(isOpen ? null : g.id)}
                      className={topLink(isOpen || groupCurrent(g))}
                    >
                      {g.label}
                      <ChevronIcon
                        className={`size-4 transition-transform duration-500 ease-base ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      id={`${uid}-menu-${g.id}`}
                      hidden={!isOpen}
                      className={`absolute top-full left-0 mt-2 rounded-2xl border border-line bg-paper p-2 shadow-xl ${
                        g.id === "cities" ? "w-96" : "w-80"
                      }`}
                    >
                      <ul className={g.id === "cities" ? "grid grid-cols-2" : "flex flex-col"}>
                        {g.items.map((it) => (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              onClick={closeAll}
                              aria-current={it.href === pathname ? "page" : undefined}
                              className="focus-ring block rounded-xl px-4 py-2 transition-colors duration-300 ease-base hover:bg-sand"
                            >
                              <span className="block title-4 text-ink">{it.label}</span>
                              {it.note && <span className="block caption-5 text-ink-3">{it.note}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                closeAll();
                openListProperty();
              }}
              className={`hidden md:flex ${topLink(false)}`}
            >
              List your property
            </button>
            <span className={`hidden h-6 w-px md:block ${light ? "bg-paper/30" : "bg-line"}`} aria-hidden />
            <AccountControls onDark={light} />
            <button
              type="button"
              aria-expanded={mobile}
              aria-controls={`${uid}-mobile`}
              aria-label={mobile ? "Close menu" : "Open menu"}
              onClick={() => setMobile((v) => !v)}
              className={`relative grid size-10 place-items-center rounded-lg transition-colors duration-300 ease-base active:scale-[0.98] lg:hidden ${
                light ? "focus-ring-dark text-paper hover:bg-paper/10" : "focus-ring text-ink hover:bg-sand"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute h-0.5 w-4 rounded-full bg-current transition-transform duration-500 ease-base ${
                  mobile ? "rotate-45" : "-translate-y-1"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute h-0.5 w-4 rounded-full bg-current transition-transform duration-500 ease-base ${
                  mobile ? "-rotate-45" : "translate-y-1"
                }`}
              />
            </button>
          </div>
        </nav>

        {/* Mobile: full height panel with every group listed */}
        <div
          id={`${uid}-mobile`}
          aria-hidden={!mobile}
          inert={!mobile}
          className={`fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-paper/95 backdrop-blur-xl transition-opacity duration-500 ease-base lg:hidden ${
            mobile ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
            {GROUPS.map((g, gi) => (
              <section
                key={g.id}
                aria-label={g.label}
                style={{ transitionDelay: mobile ? `${Math.min(gi * 60, 400)}ms` : "0ms" }}
                className={`transition-[opacity,transform] duration-500 ease-base motion-reduce:translate-y-0 ${
                  mobile ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                <p className="caption-3 text-ink-3">{g.label}</p>
                <ul className={`mt-2 ${g.id === "cities" ? "grid grid-cols-2 gap-x-4" : "flex flex-col"}`}>
                  {g.items.map((it) => (
                    <li key={it.href} className="border-b border-line">
                      <Link
                        href={it.href}
                        onClick={closeAll}
                        aria-current={it.href === pathname ? "page" : undefined}
                        className="focus-ring block py-2 body-2 text-ink transition-colors duration-300 ease-base hover:text-brand"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <button
              type="button"
              onClick={() => {
                closeAll();
                openListProperty();
              }}
              className="btn-secondary button-md"
            >
              List your property
            </button>
            {user ? (
              <Link href="/account" onClick={closeAll} className="btn-secondary button-md">
                Your account
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeAll();
                  openAuth();
                }}
                className="btn-primary button-md"
              >
                Log in or sign up
              </button>
            )}
          </div>
        </div>
      </header>
      <AuthDialog />
      <PropertyTypeDialog />
    </>
  );
}

/** Static stand in for the top bar while a dynamic route streams in. */
export function NavFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 w-full max-w-[1760px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-12">
        <Logo />
        <span className="size-10 animate-pulse rounded-full bg-line" aria-hidden />
      </div>
    </header>
  );
}
