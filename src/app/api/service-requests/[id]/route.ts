import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/guard";
import { addLedgerEntries, updateTicket, type TicketAction } from "@/lib/ops";
import { todayISO } from "@/lib/store";

/** Owner approves, books, completes, declines, or reopens a ticket. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as TicketAction | null;
  if (!body || !["approve", "decline", "schedule", "complete", "reopen"].includes(body.action))
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const res = await updateTicket(g.user.id, id, body);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  // A completed job with a cost lands in the ledger as an expense.
  if (body.action === "complete" && res.row.cost) {
    await addLedgerEntries([
      {
        ownerId: g.user.id,
        listingId: res.row.listingId,
        listingTitle: res.row.listingTitle,
        ticketId: res.row.id,
        kind: "expense",
        label: `${res.row.title}${res.row.vendorName ? `, ${res.row.vendorName}` : ""}`,
        amount: -res.row.cost,
        due: todayISO(),
        method: "manual",
        status: "paid",
        paidAt: new Date().toISOString(),
      },
    ]);
  }
  return NextResponse.json({ ticket: res.row });
}
