import type { Metadata } from "next";
import { PropertiesView } from "@/components/owner/views";

export const metadata: Metadata = { title: "Properties" };

export default function PropertiesPage() {
  return <PropertiesView />;
}
