import type { Metadata } from "next";
import { CustomersView } from "@/components/owner/customers";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return <CustomersView />;
}
