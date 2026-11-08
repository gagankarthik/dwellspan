import type { Metadata } from "next";
import { Suspense } from "react";
import { Explore, ExploreSkeleton } from "@/components/Explore";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Explore homes",
  description: "Search every furnished stay and long term lease. Filter by city, stay length, budget, and amenities.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Suspense fallback={<ExploreSkeleton />}>
          <Explore />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
