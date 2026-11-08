"use client";

import type { ReactNode } from "react";

export const START_LISTING_EVENT = "dwellspan:start-listing";

/** Starts the listing flow from anywhere on /list-your-property (or asks the owner to sign in first). */
export function StartListingButton({ className, children }: { className: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(START_LISTING_EVENT))}>
      {children}
    </button>
  );
}
