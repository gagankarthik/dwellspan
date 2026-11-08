import type { Metadata } from "next";
import { TeamView } from "@/components/owner/team";

export const metadata: Metadata = { title: "Team and vendors" };

export default function Page() {
  return <TeamView />;
}
