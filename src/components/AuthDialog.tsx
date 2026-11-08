"use client";

import { useEffect, useRef, useState } from "react";
import { AuthFlow } from "./AuthFlow";
import { onOpenAuth, type AuthIntent } from "./session";

/**
 * The sign in dialog. Uses the native <dialog> element, which traps focus,
 * closes on Escape, and returns focus to the button that opened it.
 */
export function AuthDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0); // remounts the form fresh on every open
  const [intent, setIntent] = useState<AuthIntent>({});

  useEffect(
    () =>
      onOpenAuth((i) => {
        setIntent(i);
        setSession((n) => n + 1);
        ref.current?.showModal();
      }),
    [],
  );

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby="auth-dialog-title"
      onClick={(e) => {
        if (e.target === ref.current) close(); // click on the backdrop
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[440px] rounded-3xl border border-line bg-paper p-0 text-ink shadow-2xl backdrop:bg-[rgb(12_18_40/0.55)] open:animate-swap"
    >
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
      <h2 id="auth-dialog-title" className="sr-only">
        Log in or sign up
      </h2>
      <div className="p-8 pt-12 sm:px-12">{session > 0 && <AuthFlow key={session} idPrefix={`dlg${session}`} role={intent.role} next={intent.next} onDone={close} />}</div>
    </dialog>
  );
}
