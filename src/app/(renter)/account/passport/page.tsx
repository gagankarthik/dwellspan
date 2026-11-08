import type { Metadata } from "next";
import { PassportView } from "@/components/renter/passport";

export const metadata: Metadata = { title: "Renter Passport" };

export default function Page() {
  return <PassportView />;
}
