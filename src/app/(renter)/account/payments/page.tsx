import type { Metadata } from "next";
import { RenterPaymentsView } from "@/components/renter/views";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <RenterPaymentsView />;
}
