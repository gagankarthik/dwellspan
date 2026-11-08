"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronIcon } from "./icons";

/* Dates are plain YYYY-MM-DD strings, built from local parts to avoid time zone drift. */
const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const LABEL_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const FULL_FMT = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

type Props = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  /** earliest selectable date; defaults to today */
  min?: string;
  /** latest selectable date */
  max?: string;
  labelId?: string;
  ariaLabel?: string;
  placeholder?: string;
  variant?: "inline" | "field";
  invalid?: boolean;
  describedBy?: string;
  align?: "left" | "right";
  size?: "sm" | "md";
  /** Allow dates before today (down to `min`), for records like an existing tenant's move in. */
  allowPast?: boolean;
};

/**
 * Calendar date picker. The trigger is a button; the calendar is a grid of
 * day buttons with roving focus: arrows move a day or a week, Page Up and
 * Page Down move a month, Home and End jump to the week's edges, Enter picks,
 * Escape closes and returns focus to the trigger.
 */
export function DatePicker({
  id: idProp,
  value,
  onChange,
  min,
  max,
  labelId,
  ariaLabel,
  placeholder = "Add date",
  variant = "field",
  invalid = false,
  describedBy,
  align = "left",
  size = "md",
  allowPast = false,
}: Props) {
  const auto = useId();
  const id = idProp ?? auto;
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<Date>(() => new Date(2000, 0, 1)); // replaced on open
  const [now, setNow] = useState<Date>(() => new Date(2000, 0, 1)); // captured on open
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const minDate = min ? fromISO(min) : null;

  const today = () => now;
  const floorFrom = (t: Date) => (allowPast ? (minDate ?? new Date(1900, 0, 1)) : minDate && minDate > t ? minDate : t);
  const floor = () => floorFrom(now);
  const maxDate = max ? fromISO(max) : null;
  const disabled = (d: Date) => d < floor() || Boolean(maxDate && d > maxDate);

  function openCalendar() {
    const t = new Date();
    const midnight = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    const lo = floorFrom(midnight);
    const start = value ? fromISO(value) : allowPast ? midnight : lo;
    setNow(midnight);
    setFocus(start < lo ? lo : start);
    moveFocus.current = true;
    setOpen(true);
  }

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  function pick(d: Date) {
    if (disabled(d)) return;
    onChange(toISO(d));
    close();
  }

  // Keep keyboard focus on the active day after it moves.
  useEffect(() => {
    if (!open || !moveFocus.current) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${toISO(focus)}"]`)?.focus();
  }, [open, focus]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function onGridKey(e: KeyboardEvent) {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
      Home: () => addDays(focus, -focus.getDay()),
      End: () => addDays(focus, 6 - focus.getDay()),
    };
    if (moves[e.key]) {
      e.preventDefault();
      const next = moves[e.key]();
      moveFocus.current = true;
      setFocus(next < floor() ? floor() : next);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focus);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  // Build the visible month: leading blanks, then each day.
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const daysInMonth = new Date(focus.getFullYear(), focus.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(focus.getFullYear(), focus.getMonth(), i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const prevDisabled = new Date(focus.getFullYear(), focus.getMonth(), 0) < floor();
  const selectedISO = value;
  const todayISO = open ? toISO(today()) : "";

  const triggerCls =
    variant === "inline"
      ? `w-full min-w-0 bg-transparent text-left body-6 focus:outline-none ${value ? "text-ink-2" : "text-ink-3"}`
      : `focus-ring w-full rounded-lg border bg-paper px-4 text-left transition-colors duration-300 ease-base ${size === "sm" ? "h-10 body-6" : "h-12 body-3"} ${
          value ? "text-ink" : "text-ink-3"
        } ${invalid ? "border-error" : "border-line hover:border-ink-3"}`;

  return (
    <div ref={wrap} className="relative">
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId ? `${labelId} ${id}` : undefined}
        aria-label={labelId ? undefined : ariaLabel}
        aria-describedby={describedBy}
        onClick={() => (open ? close(false) : openCalendar())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            openCalendar();
          }
        }}
        className={triggerCls}
      >
        {value ? LABEL_FMT.format(fromISO(value)) : placeholder}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Choose a date"
          className={`absolute top-full z-40 mt-2 w-80 rounded-2xl border border-line bg-paper p-4 text-left shadow-2xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={prevDisabled}
              onClick={() => {
                moveFocus.current = false;
                setFocus(addMonths(focus, -1) < floor() ? floor() : addMonths(focus, -1));
              }}
              className="focus-ring grid size-8 place-items-center rounded-full text-ink transition-colors duration-300 ease-base hover:bg-sand disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronIcon className="size-4 rotate-90" />
            </button>
            <p className="title-3 text-ink" aria-live="polite">
              {MONTH_FMT.format(focus)}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => {
                moveFocus.current = false;
                setFocus(addMonths(focus, 1));
              }}
              className="focus-ring grid size-8 place-items-center rounded-full text-ink transition-colors duration-300 ease-base hover:bg-sand"
            >
              <ChevronIcon className="size-4 -rotate-90" />
            </button>
          </div>

          <div ref={grid} role="grid" aria-label={MONTH_FMT.format(focus)} onKeyDown={onGridKey} className="mt-4">
            <div role="row" className="grid grid-cols-7">
              {WEEKDAYS.map((w) => (
                <span key={w} role="columnheader" className="grid h-8 place-items-center caption-4 text-ink-3">
                  {w}
                </span>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} role="row" className="grid grid-cols-7">
                {week.map((d, di) => {
                  if (!d) return <span key={di} role="gridcell" />;
                  const iso = toISO(d);
                  const isSel = iso === selectedISO;
                  const isToday = iso === todayISO;
                  const off = disabled(d);
                  const isFocus = iso === toISO(focus);
                  return (
                    <span key={iso} role="gridcell" aria-selected={isSel} className="grid place-items-center py-1">
                      <button
                        type="button"
                        data-iso={iso}
                        tabIndex={isFocus ? 0 : -1}
                        disabled={off}
                        aria-label={FULL_FMT.format(d)}
                        aria-current={isToday ? "date" : undefined}
                        onClick={() => pick(d)}
                        className={`focus-ring grid size-10 place-items-center rounded-full body-5 transition-colors duration-300 ease-base ${
                          isSel
                            ? "bg-ink text-paper"
                            : off
                              ? "cursor-not-allowed text-ink-3 line-through"
                              : `text-ink hover:bg-sand ${isToday ? "ring-1 ring-ink ring-inset" : ""}`
                        }`}
                      >
                        {d.getDate()}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="focus-ring rounded body-4 text-ink underline underline-offset-4 hover:text-brand"
            >
              Clear
            </button>
            <button type="button" onClick={() => pick(allowPast ? today() : floor())} className="btn-secondary button-sm">
              {!allowPast && minDate && minDate > today() ? "Earliest date" : "Today"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
