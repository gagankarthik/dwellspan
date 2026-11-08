import type { Metadata } from "next";
import { LedgerView } from "@/components/owner/ledger";

export const metadata: Metadata = { title: "Ledger" };

export default function Page() {
  return <LedgerView />;
}
