import type { Metadata } from "next";
import { RepairsView } from "@/components/renter/views";

export const metadata: Metadata = { title: "Repairs" };

export default function Page() {
  return <RepairsView />;
}
