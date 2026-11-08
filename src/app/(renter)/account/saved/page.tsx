import type { Metadata } from "next";
import { SavedView } from "@/components/renter/views";

export const metadata: Metadata = { title: "Saved homes" };

export default function Page() {
  return <SavedView />;
}
