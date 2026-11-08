import type { Metadata } from "next";
import { AuthFlow } from "@/components/AuthFlow";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell>
      <AuthFlow idPrefix="page" />
    </AuthShell>
  );
}
