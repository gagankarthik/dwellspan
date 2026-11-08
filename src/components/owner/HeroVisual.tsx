import { BroomIcon, WrenchIcon } from "@phosphor-icons/react/dist/ssr";

type Kind = "monthly" | "yearly" | "open";
type Bar = { col: string; kind: Kind; label: string };

const barStyle: Record<Kind, string> = {
  monthly: "border-brand-bright/50 bg-surface-2 text-brand-bright",
  yearly: "border-fg/50 bg-surface-2 text-fg",
  open: "border-dashed border-surface-4 bg-transparent text-muted",
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const units: { name: string; address: string; bars: Bar[] }[] = [
  {
    name: "Unit 4B",
    address: "1180 Alder St",
    bars: [
      { col: "1 / 4", kind: "monthly", label: "Halden Consulting · 3 mo" },
      { col: "4 / 13", kind: "yearly", label: "Ellis family · lease from Mar 15" },
    ],
  },
  {
    name: "Unit 2A",
    address: "1180 Alder St",
    bars: [{ col: "1 / 13", kind: "yearly", label: "D. Nguyen · lease renews Aug 1" }],
  },
  {
    name: "Unit 7C",
    address: "42 Larch Ave",
    bars: [
      { col: "1 / 3", kind: "monthly", label: "S. Rivera · 2 mo" },
      { col: "3 / 7", kind: "monthly", label: "M. Okafor · 4 mo" },
      { col: "7 / 9", kind: "open", label: "Listed monthly" },
      { col: "9 / 13", kind: "open", label: "Lease opens Sep" },
    ],
  },
];

const ledger = [
  { label: "Card · S. Rivera", amount: "$2,790.00", dot: "bg-brand-bright" },
  { label: "ACH · Halden Consulting", amount: "$3,490.00", dot: "bg-brand-bright" },
  { label: "ACH · D. Nguyen lease", amount: "$2,410.00", dot: "bg-fg" },
];

export function HeroVisual() {
  return (
    <figure className="mx-auto w-full">
      <div className="rounded-3xl border border-surface-3 bg-surface-1 p-2">
        <div className="grid gap-6 rounded-2xl border border-surface-3 bg-base p-4 md:p-6 lg:grid-cols-[1fr_280px]">
          {/* Flex timeline */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="caption-5 text-subtle">Flex calendar · 3 units</p>
                <p className="title-1 text-fg">2027 occupancy</p>
              </div>
              <div className="flex items-center gap-4 caption-5 text-muted">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand-bright" aria-hidden /> Monthly
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-fg" aria-hidden /> Yearly
                </span>
              </div>
            </div>

            <div className="no-scrollbar mt-6 overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[88px_1fr] gap-2">
                  <span />
                  <div className="grid grid-cols-12 gap-2">
                    {months.map((m) => (
                      <span key={m} className="caption-5 text-subtle">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {units.map((u) => (
                    <div key={u.name} className="grid grid-cols-[88px_1fr] items-center gap-2">
                      <div>
                        <p className="caption-4 text-fg">{u.name}</p>
                        <p className="caption-5 text-subtle">{u.address}</p>
                      </div>
                      <div className="grid h-10 grid-cols-12 gap-2 rounded-lg bg-surface-1 p-2">
                        {u.bars.map((b) => (
                          <span
                            key={b.label}
                            style={{ gridColumn: b.col }}
                            className={`flex min-w-0 items-center rounded border px-2 ${barStyle[b.kind]}`}
                          >
                            <span className="truncate caption-4">{b.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-2">
              {[
                ["83.3%", "Unit months booked in 2027"],
                ["2", "Units on yearly leases"],
                ["Jul 1", "Next open gap, Unit 7C"],
              ].map(([v, k]) => (
                <div key={k} className="rounded-xl border border-surface-3 bg-surface-1 p-4">
                  <dt className="caption-5 text-subtle">{k}</dt>
                  <dd className="mt-2 font-mono title-1 text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Ledger and dispatch */}
          <div className="flex flex-col gap-2">
            <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
              <div className="flex items-center justify-between">
                <p className="title-4 text-fg">Universal ledger</p>
                <span className="caption-5 text-subtle">January</span>
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {ledger.map((l) => (
                  <li key={l.label} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${l.dot}`} aria-hidden />
                      <span className="truncate caption-5 text-muted">{l.label}</span>
                    </span>
                    <span className="font-mono caption-4 text-fg">{l.amount}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-2 px-4 py-2">
                <span className="caption-4 text-muted">Collected</span>
                <span className="font-mono body-4 text-fg">$8,690.00</span>
              </div>
            </div>
            <div className="rounded-xl border border-surface-3 bg-surface-1 p-4">
              <p className="title-4 text-fg">Dispatch</p>
              <ul className="mt-2 flex flex-col gap-2">
                <li className="flex items-start gap-2">
                  <BroomIcon className="mt-1 size-4 shrink-0 text-brand-bright" aria-hidden />
                  <span className="caption-5 text-muted">
                    <span className="block caption-4 text-fg">Move out clean · Unit 7C</span>
                    Sent to Lena&apos;s Cleaning Co. for Feb 28, 10:00 AM
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <WrenchIcon className="mt-1 size-4 shrink-0 text-brand-bright" aria-hidden />
                  <span className="caption-5 text-muted">
                    <span className="block caption-4 text-fg">Dishwasher leak · Unit 2A</span>
                    Ticket #2214 waiting for your approval
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Preview of the Dwellspan owner dashboard. A 2027 timeline shows three units moving between furnished monthly
        stays and yearly leases, next to a ledger that totals card and ACH rent, and a dispatch feed for cleaning and
        repairs.
      </figcaption>
    </figure>
  );
}
