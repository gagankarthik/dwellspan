"use client";

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { CloseIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Renders the body as a form; the footer's submit button submits it. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  /** For confirm dialogs without a form. */
  onConfirm?: () => void;
  submitLabel?: string;
  busy?: boolean;
  tone?: "default" | "danger";
  size?: "sm" | "md" | "lg";
  /** Hide the footer buttons (the body brings its own actions). */
  bare?: boolean;
};

/**
 * Modal dialog on the native <dialog> element: focus is trapped, Escape and
 * the backdrop close it, and focus returns to whatever opened it.
 */
export function Dialog({ open, onClose, title, description, children, onSubmit, onConfirm, submitLabel = "Save", busy, tone = "default", size = "md", bare }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const width = { sm: "w-[min(440px,calc(100vw-32px))]", md: "w-[min(560px,calc(100vw-32px))]", lg: "w-[min(720px,calc(100vw-32px))]" }[size];
  const body = (
    <>
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <h2 id={titleId} className="subhead text-ink">
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1 body-6 text-ink-2">
              {description}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="focus-ring -mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors duration-300 ease-base hover:bg-sand hover:text-ink">
          <CloseIcon className="size-5" />
        </button>
      </div>
      {children && <div className="flex flex-col gap-4 px-6 py-6">{children}</div>}
      {!bare && (
        <div className={`flex justify-end gap-2 px-6 pb-6 ${children ? "" : "pt-6"}`}>
          <button type="button" onClick={onClose} className="btn-secondary button-sm h-10">
            Cancel
          </button>
          <button
            type={onSubmit ? "submit" : "button"}
            onClick={onSubmit ? undefined : onConfirm}
            disabled={busy}
            className={tone === "danger" ? "focus-ring inline-flex h-10 items-center rounded-lg bg-error px-4 button-sm text-paper transition-opacity duration-300 ease-base hover:opacity-90 disabled:opacity-60" : "btn-primary button-sm h-10"}
          >
            {busy ? "Saving" : submitLabel}
          </button>
        </div>
      )}
    </>
  );

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={`m-auto ${width} max-h-none overflow-visible rounded-3xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-[rgb(12_18_40/0.45)] open:animate-swap`}
    >
      {open &&
        (onSubmit ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
            noValidate
          >
            {body}
          </form>
        ) : (
          body
        ))}
    </dialog>
  );
}
