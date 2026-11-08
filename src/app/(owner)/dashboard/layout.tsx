import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OwnerShell } from "@/components/owner/OwnerShell";

export const metadata: Metadata = { title: { default: "Owner dashboard", template: "%s | Owner dashboard" }, robots: { index: false } };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <OwnerShell>{children}</OwnerShell>;
}
