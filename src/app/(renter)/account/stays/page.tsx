import type { Metadata } from "next";
import { StaysView } from "@/components/renter/views";

export const metadata: Metadata = { title: "Stays and requests" };

export default function Page() {
  return <StaysView />;
}
