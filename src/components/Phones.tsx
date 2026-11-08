import { BankIcon, BroomIcon, KeyIcon, MapPinIcon, WrenchIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="w-full max-w-[300px]">
      {/* Outer 32px radius, 8px gap, inner 24px */}
      <div className="rounded-4xl bg-ink p-2 shadow-2xl">
        <div className="flex min-h-[480px] flex-col rounded-3xl border border-surface-3 bg-base p-4">
          <div className="mx-auto h-1.5 w-16 rounded-full bg-surface-3" aria-hidden />
          {children}
        </div>
      </div>
      <figcaption className="mt-4 text-center caption-2 text-ink-2">{label}</figcaption>
    </figure>
  );
}

export function MonthlyPhone() {
  return (
    <Phone label="A furnished monthly stay">
      <p className="mt-6 caption-5 text-subtle">Moving in today</p>
      <p className="title-1 text-fg">Welcome, Sofia</p>
      <p className="mt-2 flex items-center gap-2 caption-5 text-muted">
        <MapPinIcon aria-hidden className="size-3" /> 42 Larch Ave, Unit 7C
      </p>
      <div className="mt-6 rounded-2xl border border-brand-bright/40 bg-surface-1 p-4">
        <p className="flex items-center gap-2 caption-4 text-brand-bright">
          <KeyIcon aria-hidden className="size-3" /> Your door code
        </p>
        <p className="mt-2 font-mono heading-3 tracking-widest text-fg">4817</p>
        <p className="mt-2 caption-5 text-muted">Active Jan 3 through Feb 28</p>
      </div>
      <div className="mt-2 rounded-2xl border border-surface-3 bg-surface-1 p-4">
        <p className="caption-4 text-fg">Month 2 of 2</p>
        <div className="mt-2 h-1.5 rounded-full bg-surface-3">
          <div className="h-1.5 w-1/2 rounded-full bg-brand-bright" />
        </div>
        <p className="mt-2 caption-5 text-muted">$2,790.00 charged to Visa ending 4417 on Feb 3</p>
      </div>
      <p className="mt-auto flex items-center justify-center gap-2 pt-6 caption-5 text-subtle">
        <BroomIcon aria-hidden className="size-3" /> Move out clean booked for Feb 28
      </p>
    </Phone>
  );
}

export function TenantPhone() {
  return (
    <Phone label="A 12 month lease">
      <p className="mt-6 caption-5 text-subtle">Lease · Unit 4B</p>
      <p className="title-1 text-fg">Hi, Jordan</p>
      <p className="mt-2 caption-5 text-muted">Signed in app on Feb 2, 2027</p>
      <div className="mt-6 rounded-2xl border border-fg/40 bg-surface-1 p-4">
        <p className="caption-4 text-fg">Next rent</p>
        <p className="mt-2 font-mono heading-3 text-fg">$2,685.00</p>
        <p className="mt-2 flex items-center gap-2 caption-5 text-muted">
          <BankIcon aria-hidden className="size-3" /> Autopay Apr 1 from checking ending 6620
        </p>
      </div>
      <div className="mt-2 rounded-2xl border border-surface-3 bg-surface-1 p-4">
        <p className="flex items-center gap-2 caption-4 text-fg">
          <WrenchIcon aria-hidden className="size-4 text-muted" /> Dishwasher leak
        </p>
        <p className="mt-2 caption-5 text-muted">Ticket #2214 · plumber booked Thu 9:30 AM</p>
      </div>
      <span className="mt-auto block rounded-xl border border-surface-3 bg-surface-2 py-2 text-center button-sm text-fg">
        Report a repair
      </span>
    </Phone>
  );
}
