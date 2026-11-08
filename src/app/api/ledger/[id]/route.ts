import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/guard";
import { removeLedgerEntry, setLedgerStatus } from "@/lib/ops";

/** Mark a charge paid, or back to scheduled. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const b = (await request.json().catch(() => null)) as { status?: string } | null;
  if (b?.status !== "paid" && b?.status !== "scheduled") return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  const entry = await setLedgerStatus(g.user.id, (await params).id, b.status);
  return entry ? NextResponse.json({ entry }) : NextResponse.json({ error: "We could not find that entry." }, { status: 404 });
}

/** Only manual entries can be removed; charges from a request stay for the record. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const ok = await removeLedgerEntry(g.user.id, (await params).id);
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Charges from a request cannot be removed." }, { status: 404 });
}
