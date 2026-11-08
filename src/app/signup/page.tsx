import type { Metadata } from "next";
import { AuthFlow } from "@/components/AuthFlow";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell>
      <AuthFlow idPrefix="page" />
    </AuthShell>
  );
}
