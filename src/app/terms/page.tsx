import type { Metadata } from "next";
import { SimplePage } from "@/components/SimplePage";

export const metadata: Metadata = { title: "Terms of service", robots: { index: false } };

export default function Terms() {
  return (
    <SimplePage title="Terms of service">
      <p>Last updated November 6, 2026. This is a working draft and will be reviewed before launch.</p>
      <h2 className="mt-4 subhead text-ink">Using Dwellspan</h2>
      <p>
        You need an account to save homes, book a furnished stay, or apply for a lease. Keep your login details private
        and tell us if you think someone else has used your account.
      </p>
      <h2 className="mt-4 subhead text-ink">Listings</h2>
      <p>
        Owners are responsible for the accuracy of their listings, prices, and fees. Every fee must be shown to renters
        before they book or sign.
      </p>
      <h2 className="mt-4 subhead text-ink">Payments</h2>
      <p>Furnished stays are charged by card each month. Leases are paid by ACH autopay on the schedule in the lease.</p>
    </SimplePage>
  );
}
