import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RenterShell } from "@/components/renter/RenterShell";

export const metadata: Metadata = { title: { default: "Your account", template: "%s | Your account" }, robots: { index: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <RenterShell>{children}</RenterShell>;
}
