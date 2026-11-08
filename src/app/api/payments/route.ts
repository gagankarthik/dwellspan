import { NextResponse, type NextRequest } from "next/server";
import { requireUser, noStore } from "@/lib/guard";
import { ledgerForRenter } from "@/lib/ops";

/** A renter's own charges: rent, fees, and deposits, scheduled and paid. */
export async function GET(request: NextRequest) {
  const g = await requireUser(request);
  if (g.error) return g.error;
  const rows = (await ledgerForRenter(g.user.id)).sort((a, b) => a.due.localeCompare(b.due));
  return NextResponse.json(
    {
      payments: rows.map((e) => ({
        id: e.id,
        listingId: e.listingId,
        listingTitle: e.listingTitle,
        requestId: e.requestId,
        kind: e.kind,
        label: e.label,
        amount: e.amount,
        due: e.due,
        method: e.method,
        status: e.status,
        paidAt: e.paidAt,
      })),
    },
    noStore,
  );
}
