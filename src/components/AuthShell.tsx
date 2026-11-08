import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="bg-sand px-4 py-16 sm:px-6">
        <h1 className="sr-only">Log in or sign up</h1>
        <div className="mx-auto w-full max-w-[480px] rounded-2xl border border-line bg-paper p-6 shadow-lg sm:p-8">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
