import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { LogoLockup, LogoSymbol, SYMBOL_PATH, Wordmark } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Brand guidelines",
  description: "The Dwellspan logo, colours, and type, and how to use them.",
};

function Section({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="py-16">
      <Container className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <h2 id={`${id}-title`} className="heading-2">
            {title}
          </h2>
          <p className="mt-4 max-w-[60ch] body-3 text-ink-2">{intro}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </Container>
    </section>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid min-h-48 place-items-center overflow-hidden rounded-2xl border border-line p-8 ${className}`}>{children}</div>
  );
}

const colors = [
  { name: "Cobalt", hex: "#2350D9", share: "10%", use: "The symbol, buttons, links, and selected states", cls: "bg-brand text-paper" },
  { name: "Ink", hex: "#1F1F1F", share: "30%", use: "Text, dark sections, and the logo on light photos", cls: "bg-ink text-paper" },
  { name: "Mist", hex: "#F7F7F7", share: "30%", use: "Alternate sections and input hover states", cls: "bg-sand text-ink border border-line" },
  { name: "White", hex: "#FFFFFF", share: "60%", use: "The page, cards, and the logo on dark", cls: "bg-paper text-ink border border-line" },
];

const type = [
  ["Heading 1", "39px / 1.15", "heading-1"],
  ["Heading 2", "31px / 1.2", "heading-2"],
  ["Heading 3", "25px / 1.2", "heading-3"],
  ["Subhead", "20px / 1.4", "subhead"],
  ["Body", "16px / 1.5", "body-3"],
];

export default function BrandPage() {
  return (
    <>
      <Nav />
      <main id="main">
        {/* Hero */}
        <section aria-labelledby="brand-title" className="py-16">
          <Container className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 id="brand-title" className="heading-1">
                Brand guidelines
              </h1>
              <p className="mt-4 max-w-[60ch] lead text-ink-2">
                One line draws a roof, two walls, and an open door. It is a home you can step into, for one month or the
                next twelve.
              </p>
            </div>
            <Panel className="min-h-80 bg-sand">
              <LogoSymbol className="size-48 text-brand" />
            </Panel>
          </Container>
        </section>

        <Section
          id="logo"
          title="The logo"
          intro="The lockup pairs the symbol with the lowercase wordmark. Use it whole wherever there is room, and the symbol alone for app icons, favicons, and avatars."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel className="sm:col-span-2">
              <LogoLockup size="xl" />
            </Panel>
            <Panel>
              <LogoSymbol className="size-16 text-brand" />
            </Panel>
            <Panel>
              <Wordmark className="text-[48px] text-brand" />
            </Panel>
          </div>
        </Section>

        <Section
          id="construction"
          title="Construction"
          intro="The symbol sits on a 32 unit grid. One 2.75 unit stroke with round caps and joins, no fills. The doorway is 7 units wide and sets every spacing rule below."
        >
          <Panel className="bg-sand">
            <svg viewBox="0 0 32 32" className="size-64" aria-label="Symbol on its 32 unit construction grid" role="img">
              {Array.from({ length: 33 }, (_, i) => (
                <g key={i}>
                  <line x1={i} y1="0" x2={i} y2="32" stroke="#dddddd" strokeWidth={i % 4 ? 0.04 : 0.08} />
                  <line x1="0" y1={i} x2="32" y2={i} stroke="#dddddd" strokeWidth={i % 4 ? 0.04 : 0.08} />
                </g>
              ))}
              <path d={SYMBOL_PATH} fill="none" stroke="#2350d9" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
              <path d={SYMBOL_PATH} fill="none" stroke="#1f1f1f" strokeWidth="0.12" strokeDasharray="0.4 0.4" />
              <line x1="12.5" y1="29.5" x2="19.5" y2="29.5" stroke="#1f1f1f" strokeWidth="0.12" />
              <text x="16" y="31.4" fontSize="1.2" textAnchor="middle" fill="#1f1f1f">
                door = 7 units
              </text>
            </svg>
          </Panel>
        </Section>

        <Section
          id="space"
          title="Clear space and size"
          intro="Keep one doorway width of empty space on every side of the logo. Never set the symbol smaller than 16px or the full lockup narrower than 96px."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel>
              <div className="rounded-lg border-2 border-dashed border-brand/40 p-6">
                <LogoLockup size="lg" />
              </div>
            </Panel>
            <Panel>
              <div className="flex items-end gap-8">
                <div className="text-center">
                  <LogoSymbol className="mx-auto size-4 text-brand" strokeWidth={3} />
                  <p className="mt-2 caption-5 text-ink-3">16px symbol</p>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 text-brand">
                    <LogoSymbol className="size-5" strokeWidth={3} />
                    <Wordmark className="text-[16px]" />
                  </span>
                  <p className="mt-2 caption-5 text-ink-3">96px lockup</p>
                </div>
              </div>
            </Panel>
          </div>
        </Section>

        <Section
          id="color"
          title="Colour"
          intro="White leads, ink and mist support, and cobalt is the accent. Cobalt marks the one thing to do next, so it should cover about a tenth of any screen."
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {colors.map((c) => (
              <li key={c.name} className="overflow-hidden rounded-2xl border border-line">
                <div className={`flex h-32 items-end justify-between p-4 ${c.cls}`}>
                  <span className="subhead">{c.name}</span>
                  <span className="font-mono body-5">{c.share}</span>
                </div>
                <div className="p-4">
                  <p className="font-mono body-5 text-ink">{c.hex}</p>
                  <p className="mt-2 body-6 text-ink-2">{c.use}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Panel className="min-h-32 bg-paper">
              <LogoLockup />
            </Panel>
            <Panel className="min-h-32 border-ink bg-ink">
              <LogoLockup tone="white" />
            </Panel>
            <Panel className="min-h-32 border-brand bg-brand">
              <LogoLockup tone="white" />
            </Panel>
          </div>
        </Section>

        <Section
          id="type"
          title="Type"
          intro="Geist is the only typeface. Five sizes on a 1.25 ratio carry every page. Headings sit at 115 to 120% line height, body text at 150%."
        >
          <ul className="flex flex-col">
            {type.map(([name, spec, cls]) => (
              <li key={name} className="grid gap-2 border-b border-line py-4 sm:grid-cols-[160px_1fr] sm:items-baseline">
                <span className="caption-2 text-ink-3">
                  {name} · {spec}
                </span>
                <span className={`${cls} text-ink`}>Find your next home</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="misuse"
          title="What to avoid"
          intro="The logo only works when it stays the same everywhere. Do not redraw, recolour, or decorate it."
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              ["Do not stretch or squash it", <LogoLockup key="a" />, "scale-x-150"],
              ["Do not rotate it", <LogoLockup key="b" />, "-rotate-12"],
              ["Do not put the symbol in a box", <span key="c" className="grid size-16 place-items-center rounded-2xl bg-brand text-paper"><LogoSymbol className="size-10" /></span>, ""],
              ["Do not use colours outside the palette", <span key="d" className="text-[#e0484f]"><LogoLockup tone="ink" /></span>, "[&_*]:!text-[#e0484f]"],
            ].map(([label, node, cls]) => (
              <li key={label as string}>
                <Panel className="relative min-h-40 bg-sand">
                  <div className={cls as string}>{node}</div>
                  <span className="absolute top-4 right-4 grid size-6 place-items-center rounded-full bg-error caption-3 text-paper" aria-hidden>
                    ✕
                  </span>
                </Panel>
                <p className="mt-2 body-6 text-ink-2">{label as string}</p>
              </li>
            ))}
          </ul>
        </Section>
      </main>
      <Footer />
    </>
  );
}
