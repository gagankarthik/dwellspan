import type { Metadata } from "next";
import { Suspense } from "react";
import { Compare, CompareSkeleton } from "@/components/Compare";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Furnished stay or lease? Compare the true cost",
  description:
    "See what a furnished stay really costs next to a long term lease for the months you plan to stay, with utilities, furniture, and early exit costs included.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Suspense fallback={<CompareSkeleton />}>
          <Compare />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
