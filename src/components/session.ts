"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionUser = { id: string; name: string; email: string; role: "renter" | "owner"; createdAt: string };

const AUTH_EVENT = "dwellspan:auth";

/** Tell every useSession() on the page to refetch, after login or logout. */
export function announceAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: SessionUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    window.addEventListener(AUTH_EVENT, load);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(AUTH_EVENT, load);
    };
  }, [load]);

  return { user, loading };
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  announceAuthChange();
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const OPEN_AUTH_EVENT = "dwellspan:open-auth";

export type AuthIntent = { role?: "renter" | "owner"; next?: string };

/**
 * Opens the sign in dialog in place, wherever the user is on the page.
 * `role` decides the account type for new sign ups (renter unless the owner
 * page asks for owner); `next` is where to go after logging in.
 */
export function openAuth(intent: AuthIntent = {}) {
  window.dispatchEvent(new CustomEvent<AuthIntent>(OPEN_AUTH_EVENT, { detail: intent }));
}

export function onOpenAuth(handler: (intent: AuthIntent) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<AuthIntent>).detail ?? {});
  window.addEventListener(OPEN_AUTH_EVENT, listener);
  return () => window.removeEventListener(OPEN_AUTH_EVENT, listener);
}
