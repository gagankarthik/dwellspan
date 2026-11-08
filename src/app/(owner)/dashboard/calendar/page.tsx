import type { Metadata } from "next";
import { CalendarView } from "@/components/owner/calendar";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <CalendarView />;
}
