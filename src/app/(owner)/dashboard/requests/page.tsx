import type { Metadata } from "next";
import { RequestsView } from "@/components/owner/requests";

export const metadata: Metadata = { title: "Rental requests" };

export default function Page() {
  return <RequestsView />;
}
