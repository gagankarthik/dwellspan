"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowIcon } from "./icons";
import { PROPERTY_TYPE_OPTIONS, type PropertyType } from "./propertyTypes";
import { openAuth, useSession } from "./session";

const OPEN_EVENT = "dwellspan:list-property";
export const LISTING_TYPE_EVENT = "dwellspan:listing-type";
export const DRAFT_KEY = "dwellspan:listing-draft";

/** Opens the property type picker from anywhere ("List your property" buttons). */
export function openListProperty() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Saves the chosen type into the listing draft so the flow starts with it selected. */
function rememberType(type: PropertyType) {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as Record<string, unknown>;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, propertyType: type }));
  } catch {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ propertyType: type }));
  }
}

export function PropertyTypeDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const { user } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const open = () => {
      ref.current?.showModal();
      ref.current?.focus(); // start on the dialog itself, not with a ring on the close button
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const close = () => ref.current?.close();

  function choose(type: PropertyType) {
    rememberType(type);
    close();
    if (!user) {
      // New owners sign up as owners and land on their dashboard, where the listing waits for them.
      openAuth({ role: "owner", next: "/dashboard" });
      return;
    }
    if (pathname === "/list-your-property") window.dispatchEvent(new CustomEvent(LISTING_TYPE_EVENT, { detail: type }));
    else router.push("/list-your-property?start=1");
  }

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby="ptype-title"
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-2xl overflow-hidden focus:outline-none rounded-3xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-[rgb(12_18_40/0.55)] open:animate-swap"
    >
      <div className="flex max-h-[calc(100dvh-32px)] flex-col">
        <header className="relative shrink-0 px-6 pt-8 pb-4 text-center sm:px-12">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="focus-ring absolute top-4 right-4 grid size-10 place-items-center rounded-full text-ink transition-colors duration-300 ease-base hover:bg-sand"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <h2 id="ptype-title" className="heading-2 text-ink">
            What kind of place are you listing?
          </h2>
          <p className="mt-2 body-3 text-ink-2">Pick the closest match. You can change it later.</p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-12">
          <ul className="grid gap-4 pt-4 sm:grid-cols-2">
            {PROPERTY_TYPE_OPTIONS.map(({ value, label, note, Icon }) => (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => choose(value)}
                  className="focus-ring group flex h-full w-full flex-col gap-6 rounded-2xl border border-line bg-paper p-6 text-left transition-[transform,border-color,box-shadow] duration-300 ease-base hover:-translate-y-1 hover:border-ink hover:shadow-lg active:scale-[0.98]"
                >
                  <span className="grid size-16 place-items-center rounded-2xl bg-sand transition-colors duration-300 ease-base group-hover:bg-brand-soft">
                    <Icon className="size-10 text-ink transition-colors duration-300 ease-base group-hover:text-brand" />
                  </span>
                  <span>
                    <span className="block subhead text-ink">{label}</span>
                    <span className="block body-6 text-ink-2">{note}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <footer className="shrink-0 px-6 pt-2 pb-8 text-center sm:px-12">
          <Link
            href="/list-your-property"
            onClick={close}
            className="focus-ring inline-flex items-center gap-2 rounded body-4 text-ink underline underline-offset-4 hover:text-brand"
          >
            New to listing? See how it works <ArrowIcon className="size-4" />
          </Link>
        </footer>
      </div>
    </dialog>
  );
}
