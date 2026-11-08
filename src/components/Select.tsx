"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CheckIcon, ChevronIcon } from "./icons";

export type SelectOption = { value: string; label: string; note?: string };

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** id of the visible <label>, so the button reads as "Stay length, 3 months" */
  labelId?: string;
  ariaLabel?: string;
  /** inline: bare text inside a search bar field. field: a bordered form control. */
  variant?: "inline" | "field";
  tone?: "light" | "dark";
  invalid?: boolean;
  /** sm for compact filter bars, md for forms */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Listbox select (WAI ARIA "select only combobox" pattern):
 * Enter, Space, or the arrows open it; arrows, Home, and End move; Enter
 * picks; Escape or Tab closes; typing a letter jumps to the next match.
 */
export function Select({
  id: idProp,
  value,
  onChange,
  options,
  labelId,
  ariaLabel,
  variant = "field",
  tone = "light",
  invalid = false,
  size = "md",
  className = "",
}: Props) {
  const auto = useId();
  const id = idProp ?? auto;
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);

  function openAt(i: number) {
    setActive(i);
    setOpen(true);
  }

  function pick(i: number) {
    onChange(options[i].value);
    setOpen(false);
    button.current?.focus();
  }

  function typeahead(key: string, now: number) {
    const t = typed.current;
    t.text = now - t.at < 600 ? t.text + key.toLowerCase() : key.toLowerCase();
    t.at = now;
    const start = open ? active + 1 : selectedIndex + 1;
    for (let k = 0; k < options.length; k++) {
      const i = (start + k) % options.length;
      if (options[i].label.toLowerCase().startsWith(t.text)) return i;
    }
    return -1;
  }

  function onButtonKey(e: KeyboardEvent) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openAt(selectedIndex);
    } else if (e.key.length === 1) {
      const i = typeahead(e.key, e.timeStamp);
      if (i >= 0) onChange(options[i].value);
    }
  }

  function onListKey(e: KeyboardEvent) {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(a + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        pick(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        button.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (e.key.length === 1) {
          const i = typeahead(e.key, e.timeStamp);
          if (i >= 0) setActive(i);
        }
    }
  }

  const dark = tone === "dark";
  const trigger =
    variant === "inline"
      ? `w-full min-w-0 bg-transparent text-left body-6 ${dark ? "text-fg" : "text-ink-2"} focus:outline-none`
      : `w-full rounded-lg border px-4 text-left transition-colors duration-300 ease-base ${size === "sm" ? "h-10 body-6" : "h-12 body-3"} ${
          dark
            ? `bg-surface-1 text-fg ${invalid ? "border-danger" : "border-surface-3 hover:border-surface-4"} focus-ring-dark`
            : `bg-paper text-ink ${invalid ? "border-error" : "border-line hover:border-ink-3"} focus-ring`
        }`;

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        ref={button}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId ? `${labelId} ${id}` : undefined}
        aria-label={labelId ? undefined : ariaLabel}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={onButtonKey}
        className={`flex items-center justify-between gap-2 ${trigger}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronIcon
          className={`size-4 shrink-0 transition-transform duration-500 ease-base ${open ? "rotate-180" : ""} ${
            dark ? "text-muted" : "text-ink-3"
          }`}
        />
      </button>

      <ul
        ref={list}
        id={listId}
        role="listbox"
        tabIndex={-1}
        hidden={!open}
        aria-labelledby={labelId}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onKeyDown={onListKey}
        className="absolute top-full left-0 z-30 mt-2 max-h-72 w-max min-w-full max-w-[320px] overflow-y-auto rounded-xl border border-line bg-paper p-2 shadow-xl focus:outline-none"
      >
        {options.map((o, i) => {
          const isSel = o.value === value;
          return (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={isSel}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg px-4 py-2 ${
                i === active ? "bg-sand" : ""
              }`}
            >
              <span>
                <span className={`block ${isSel ? "body-4 text-brand" : "body-6 text-ink"}`}>{o.label}</span>
                {o.note && <span className="block caption-5 text-ink-3">{o.note}</span>}
              </span>
              {isSel && <CheckIcon className="size-4 shrink-0 text-brand" strokeWidth={2.25} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
