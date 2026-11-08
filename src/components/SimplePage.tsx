import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

/** Shell for secondary pages: a way back home, a heading, and the footer. */
export function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-paper">
        <nav aria-label="Main" className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          <Logo />
          <Link
            href="/"
            className="focus-ring flex items-center gap-2 rounded-lg px-4 py-2 button-sm text-ink-2 transition-colors duration-300 ease-base hover:bg-sand hover:text-ink active:scale-[0.98]"
          >
            <ArrowLeftIcon aria-hidden className="size-4" /> Back to home
          </Link>
        </nav>
      </header>
      <main id="main" className="min-h-[70vh] bg-sand">
        <div className="mx-auto w-full max-w-[680px] px-4 pt-16 pb-16 sm:px-6 md:pt-16">
        <h1 className="heading-1 text-ink">
          {title}
        </h1>
        <div className="mt-8 flex flex-col gap-4 body-3 text-ink-2">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
