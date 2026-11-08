import type { Metadata } from "next";
import { ServiceView } from "@/components/owner/service";

export const metadata: Metadata = { title: "Service requests" };

export default function Page() {
  return <ServiceView />;
}
