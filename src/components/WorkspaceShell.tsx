"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BellIcon, ChevronIcon, LogoutIcon } from "./icons";
import { LogoLockup } from "./Logo";
import { initials, logout, type SessionUser } from "./session";

type IconC = (p: { className?: string }) => ReactNode;
export type NavGroup = { label: string; items: { href: string; label: string; Icon: IconC; count?: number }[] };
export type Alert = { key: string; href: string; Icon: IconC; title: string; meta: string };
export type MenuLink = { href: string; label: string; Icon: IconC };

type Props = {
  home: string;
  label: string;
  groups: NavGroup[];
  cta?: ReactNode;
  help?: { title: string; body: string; links: MenuLink[] };
  alerts: Alert[];
  user: SessionUser | null;
  menu: MenuLink[];
  children: ReactNode;
  /** Routes that use the full width, like a calendar. */
  wide?: string[];
};

/**
 * Signed in workspace (owner dashboard and renter account): a light sidebar
 * with grouped navigation, and a top bar with notifications and the profile menu.
 * Children always render; each page shows its own loading state.
 */
export function WorkspaceShell({ home, label, groups, cta, help, alerts, user, menu, children, wide = [] }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const active = (href: string) => (href === home ? pathname === href : pathname.startsWith(href));
  const current = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))).find((i) => active(i.href));

  const sidebar = (
    <div className="flex h-full flex-col border-r border-line bg-paper">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href={home} className="focus-ring rounded-lg" aria-label={`${label} home`}>
          <LogoLockup tone="brand" />
        </Link>
      </div>
      {cta && <div className="px-4 pt-2">{cta}</div>}
      <nav aria-label={label} className="no-scrollbar mt-4 flex-1 overflow-y-auto px-4 pb-4">
        {groups.map((g) => (
          <div key={g.label} className="mt-4 first:mt-0">
            <p className="px-4 pb-1 caption-4 text-ink-2">{g.label}</p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map(({ href, label: text, Icon, count }) => {
                const on = active(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={on ? "page" : undefined}
                      className={`focus-ring relative flex h-10 items-center gap-3 rounded-lg px-4 body-5 transition-colors duration-300 ease-base ${
                        on ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-sand hover:text-ink"
                      }`}
                    >
                      {on && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" />}
                      <Icon className="size-5 shrink-0" />
                      <span className="flex-1 truncate">{text}</span>
                      {count ? (
                        <span className="grid min-w-6 place-items-center rounded-full bg-brand px-2 caption-3 text-paper">
                          {count}
                          <span className="sr-only"> waiting</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {help && (
        <div className="m-4 mt-0 rounded-2xl bg-sand p-4">
          <p className="title-4 text-ink">{help.title}</p>
          <p className="mt-1 caption-5 text-ink-2">{help.body}</p>
          <div className="mt-2 flex flex-col">
            {help.links.map(({ href, label: text, Icon }) => (
              <Link key={href} href={href} className="focus-ring flex items-center gap-2 rounded py-1 caption-4 text-ink hover:text-brand">
                <Icon className="size-4" /> {text}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-sand">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      <div id="workspace-drawer" inert={!open} aria-hidden={!open} className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-[rgb(12_18_40/0.4)] transition-opacity duration-500 ease-base ${open ? "opacity-100" : "opacity-0"}`} aria-hidden />
        <aside className={`absolute inset-y-0 left-0 w-72 shadow-2xl transition-transform duration-500 ease-base motion-reduce:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>
      </div>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-paper/90 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="workspace-drawer"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="focus-ring relative grid size-10 place-items-center rounded-lg text-ink hover:bg-sand lg:hidden"
          >
            <span aria-hidden className="absolute h-0.5 w-4 -translate-y-1 rounded-full bg-current" />
            <span aria-hidden className="absolute h-0.5 w-4 translate-y-1 rounded-full bg-current" />
          </button>
          <Link href={home} className="focus-ring rounded-lg lg:hidden" aria-label={`${label} home`}>
            <LogoLockup tone="brand" />
          </Link>
          <p className="hidden body-5 text-ink-2 lg:block">{current ? `${current.group} / ${current.label}` : label}</p>
          <div className="ml-auto flex items-center gap-2">
            <Notifications alerts={alerts} />
            <ProfileMenu user={user} menu={menu} />
          </div>
        </header>
        <main id="main" className={wide.some((w) => pathname.startsWith(w)) ? "px-4 py-6 sm:px-6" : "px-4 py-8 sm:px-8 lg:px-12 lg:py-10"}>
          <div className={wide.some((w) => pathname.startsWith(w)) ? "w-full" : "mx-auto w-full max-w-6xl"}>{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Closes on outside click and Escape, returning focus to the trigger. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
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
  return { open, setOpen, ref, btn, id };
}

const panel = "absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-paper p-2 shadow-xl animate-swap";

function Notifications({ alerts }: { alerts: Alert[] }) {
  const { open, setOpen, ref, btn, id } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button
        ref={btn}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        aria-label={alerts.length ? `Notifications, ${alerts.length} need attention` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring relative grid size-10 place-items-center rounded-full text-ink-2 transition-colors duration-300 ease-base hover:bg-sand hover:text-ink"
      >
        <BellIcon className="size-5" />
        {alerts.length > 0 && <span aria-hidden className="absolute right-2 top-2 size-2 rounded-full bg-brand ring-2 ring-paper" />}
      </button>
      {open && (
        <div id={id} className={panel}>
          <p className="px-2 py-2 title-4 text-ink">Needs your attention</p>
          {alerts.length === 0 ? (
            <p className="px-2 pb-4 body-6 text-ink-2">You are all caught up.</p>
          ) : (
            <ul>
              {alerts.slice(0, 6).map(({ key, href, Icon, title, meta }) => (
                <li key={key}>
                  <Link href={href} onClick={() => setOpen(false)} className="focus-ring flex gap-3 rounded-xl p-2 transition-colors duration-300 ease-base hover:bg-sand">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate body-5 text-ink">{title}</span>
                      <span className="block truncate caption-5 text-ink-2">{meta}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ user, menu }: { user: SessionUser | null; menu: MenuLink[] }) {
  const router = useRouter();
  const { open, setOpen, ref, btn, id } = usePopover();
  const [leaving, setLeaving] = useState(false);
  if (!user) return <span className="size-10 animate-pulse rounded-full bg-line" aria-label="Loading account" />;
  const item = "focus-ring flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left body-6 text-ink transition-colors duration-300 ease-base hover:bg-sand";
  return (
    <div ref={ref} className="relative">
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex h-10 items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-2 transition-colors duration-300 ease-base hover:bg-sand"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand caption-3 text-paper" aria-hidden>
          {initials(user.name)}
        </span>
        <span className="hidden max-w-32 truncate body-5 text-ink sm:block">{user.name.split(/\s+/)[0]}</span>
        <ChevronIcon className={`size-4 text-ink-2 transition-transform duration-300 ease-base ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={id} role="menu" className={panel}>
          <div className="flex items-center gap-3 border-b border-line px-2 pb-4 pt-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand caption-3 text-paper" aria-hidden>
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate title-4 text-ink">{user.name}</span>
              <span className="block truncate caption-5 text-ink-2">{user.email}</span>
            </span>
          </div>
          <div className="pt-2">
            {menu.map(({ href, label, Icon }) => (
              <Link key={href} role="menuitem" href={href} onClick={() => setOpen(false)} className={item}>
                <Icon className="size-4 text-ink-2" /> {label}
              </Link>
            ))}
            <button
              role="menuitem"
              type="button"
              disabled={leaving}
              onClick={async () => {
                setLeaving(true);
                await logout();
                router.push("/");
              }}
              className={`${item} text-error`}
            >
              <LogoutIcon className="size-4" /> {leaving ? "Logging out" : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
