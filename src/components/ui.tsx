import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

export type Faq = { q: string; a: string };

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}


export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="flex flex-col">
      {faqs.map((f) => (
        <details key={f.q} className="group">
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 title-3 text-ink transition-colors duration-300 ease-base hover:text-brand [&::-webkit-details-marker]:hidden">
            {f.q}
            <PlusIcon
              aria-hidden
              className="size-4 shrink-0 text-ink-3 transition-transform duration-500 ease-base group-open:rotate-45"
            />
          </summary>
          <p className="max-w-[60ch] pb-4 body-6 text-ink-2">{f.a}</p>
          <div className="h-px bg-line" aria-hidden />
        </details>
      ))}
    </div>
  );
}

/** FAQ schema for AEO. Questions whose answers are still placeholders are left out. */
export function FaqSchema({ faqs }: { faqs: Faq[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .filter((f) => !f.a.includes("{{"))
      .map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
