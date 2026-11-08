"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { leaseLabel, type Listing } from "@/lib/listings";
import { HeartIcon, HomeIcon, StarIcon } from "./icons";
import { useSaved } from "./saved";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * A home in a grid. The whole card links to the detail page; the heart sits
 * outside the link so the two controls never nest. Pass `preview` to render
 * a non interactive copy (used in the listing flow).
 */
export function ListingCard({
  listing: l,
  offer,
  preview = false,
  sizes = "(min-width:1280px) 280px, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw",
}: {
  listing: Listing;
  offer?: string;
  preview?: boolean;
  sizes?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(l.id);
  const monthly = l.type === "monthly";

  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-line">
        {!loaded && l.img && <div className="absolute inset-0 animate-pulse bg-line" aria-hidden />}
        {!l.img && (
          <div className="absolute inset-0 grid place-items-center bg-sand text-ink-3" aria-hidden>
            <HomeIcon className="size-12" />
          </div>
        )}
        {l.img && (
          <Image
            src={l.img}
            alt={l.alt}
            fill
            sizes={sizes}
            unoptimized={l.img.startsWith("/api/") || l.img.startsWith("blob:")}
            onLoad={() => setLoaded(true)}
            className={`object-cover transition-[opacity,transform] duration-500 ease-base group-hover:scale-[1.03] ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        <span className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className={`rounded-full bg-paper px-2 py-1 caption-3 shadow-sm ${monthly ? "text-brand" : "text-ink"}`}>
            {monthly ? `Furnished · ${l.minMonths} mo min` : leaseLabel(l.leaseTerms)}
          </span>
          {offer && <span className="rounded-full bg-ink px-2 py-1 caption-3 text-paper shadow-sm">Offer</span>}
        </span>
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <h3 className="title-3 text-ink group-hover:underline group-hover:underline-offset-4">{l.title}</h3>
        <span className="flex shrink-0 items-center gap-2 caption-4 text-ink">
          {l.reviews === 0 ? (
            <span className="rounded-full bg-brand-soft px-2 py-1 caption-3 text-brand">New</span>
          ) : (
            <>
              <StarIcon className="size-3" />
              {l.rating.toFixed(2)}
              <span className="text-ink-3">({l.reviews})</span>
            </>
          )}
        </span>
      </div>
      <p className="mt-2 body-6 text-ink-2">
        {l.area}, {l.city}
      </p>
      <p className="mt-2 caption-5 text-ink-3">
        {l.beds === 0 ? "Studio" : `${l.beds} bd`} · {l.baths} ba · {l.sqft ? l.sqft.toLocaleString("en-US") : "0"} sqft
      </p>
      <p className="mt-2 caption-2 text-ink-2">
        <span className="body-4 text-ink">{l.price ? money(l.price) : "$0"}</span> / month
      </p>
    </>
  );

  return (
    <article className="group relative">
      {preview ? (
        <div>{body}</div>
      ) : (
        <Link href={`/homes/${l.id}`} className="focus-ring block rounded-2xl">
          {body}
        </Link>
      )}
      {!preview && (
        <button
          type="button"
          onClick={() => toggle(l.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${l.title} from saved homes` : `Save ${l.title}`}
          className="focus-ring absolute top-2 right-2 grid size-10 place-items-center rounded-full transition-transform duration-300 ease-base hover:scale-110 active:scale-[0.98]"
        >
          <HeartIcon
            filled={saved}
            fill={saved ? "currentColor" : "rgb(20 33 82 / 0.35)"}
            strokeWidth={2}
            className={`size-6 ${saved ? "text-brand" : "text-paper"}`}
          />
        </button>
      )}
    </article>
  );
}
