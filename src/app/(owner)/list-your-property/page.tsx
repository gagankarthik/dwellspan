import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ListingFlow } from "@/components/owner/ListingFlow";
import { Nav } from "@/components/Nav";
import { OwnerSections } from "@/components/owner/OwnerSections";

export const metadata: Metadata = {
  title: "List your property",
  description:
    "Rent your home furnished between tenants or lease it for the year. One calendar, one ledger, and cleaning and repairs that book themselves.",
  alternates: { canonical: "/list-your-property" },
};

export default function ListYourProperty() {
  return (
    <>
      <Nav />
      <main id="main" className="bg-sand px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <ListingFlow>
            <OwnerSections />
          </ListingFlow>
        </div>
      </main>
      <Footer />
    </>
  );
}
