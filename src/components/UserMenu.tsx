"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronIcon, UserIcon } from "./icons";
import { openListProperty } from "./PropertyTypeDialog";
import { initials, logout, openAuth, useSession } from "./session";

const itemCls =
  "focus-ring block w-full rounded-xl px-4 py-2 text-left body-6 text-ink transition-colors duration-300 ease-base hover:bg-sand";

/**
 * Logged out: separate "Log in" link and "Sign up" button.
 * Logged in: an avatar that opens the account menu.
 * `onDark` styles everything for the transparent bar over the hero photo.
 */
export function AccountControls({ onDark = false }: { onDark?: boolean }) {
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <span className="size-10 animate-pulse rounded-full bg-line/60" aria-label="Loading account" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuth()}
        aria-label="Log in or sign up"
        aria-haspopup="dialog"
        className={`grid size-10 place-items-center rounded-full border transition-colors duration-300 ease-base active:scale-[0.98] ${
          onDark
            ? "focus-ring-dark border-paper/40 text-paper hover:bg-paper/10"
            : "focus-ring border-line text-ink hover:border-ink-3 hover:bg-sand"
        }`}
      >
        <UserIcon className="size-5" />
      </button>
    );
  }

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full p-1 pr-2 transition-colors duration-300 ease-base active:scale-[0.98] ${
          onDark ? "focus-ring-dark text-paper hover:bg-paper/10" : "focus-ring text-ink hover:bg-sand"
        }`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand caption-3 text-paper">{initials(user.name)}</span>
        <ChevronIcon className={`size-4 transition-transform duration-500 ease-base ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id={id}
        hidden={!open}
        className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-line bg-paper p-2 shadow-xl"
      >
        <div className="px-4 py-2">
          <p className="title-4 text-ink">{user.name}</p>
          <p className="truncate caption-5 text-ink-3">{user.email}</p>
        </div>
        <div className="my-2 h-px bg-line" />
        {user.role === "owner" ? (
          <>
            <Link href="/dashboard" onClick={close} className={itemCls}>
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                close();
                openListProperty();
              }}
              className={itemCls}
            >
              List a property
            </button>
          </>
        ) : (
          <>
            <Link href="/account" onClick={close} className={itemCls}>
              Your rentals
            </Link>
            <Link href="/explore" onClick={close} className={itemCls}>
              Find a home
            </Link>
          </>
        )}
        <div className="my-2 h-px bg-line" />
        <button
          type="button"
          className={itemCls}
          onClick={async () => {
            close();
            await logout();
            router.push("/");
            router.refresh();
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
