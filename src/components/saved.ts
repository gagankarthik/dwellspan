"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "dwellspan:saved";
const EVENT = "dwellspan:saved";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** Saved homes, kept in this browser and shared across every card on the page. */
export function useSaved() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(read());
    const id = window.setTimeout(sync, 0);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((listingId: string) => {
    const now = read();
    const next = now.includes(listingId) ? now.filter((x) => x !== listingId) : [...now, listingId];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { ids, isSaved: (id: string) => ids.includes(id), toggle };
}
