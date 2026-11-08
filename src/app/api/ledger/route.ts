import { NextResponse, type NextRequest } from "next/server";
import { requireUser, noStore } from "@/lib/guard";
import { addLedgerEntries, applyLateFees, ledgerFor } from "@/lib/ops";
import { allRequests } from "@/lib/requests";
import { findListing, listByOwner } from "@/lib/userListings";

export async function GET(request: NextRequest) {
  const g = await requireUser(request, { owner: true });
  if (g.error) return g.error;
  const mine = new Set((await listByOwner(g.user.id)).map((l) => l.id));
  await applyLateFees(g.user.id, (await allRequests()).filter((r) => mine.has(r.listingId) && r.status === "accepted"));
  return NextResponse.json({ entries: await ledgerFor(g.user.id) }, noStore);
}

/** A manual entry: an expense you paid or income received outside Dwellspan. */
export async function POST(request: NextRequest) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const errors: Record<string, string> = {};
  const listing = await findListing(String(b?.listingId ?? ""));
  if (!listing || listing.ownerId !== g.user.id) errors.listingId = "Pick one of your properties.";
  const label = String(b?.label ?? "").trim().slice(0, 80);
  if (label.length < 2) errors.label = "Say what it was for.";
  const amount = Math.round(Number(b?.amount) * 100) / 100;
  if (!(amount > 0) || amount > 1_000_000) errors.amount = "Enter an amount above $0.";
  const due = String(b?.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) errors.date = "Pick a date.";
  const income = b?.direction === "income";
  if (Object.keys(errors).length || !listing) return NextResponse.json({ errors }, { status: 400 });
  const [entry] = await addLedgerEntries([
    {
      ownerId: g.user.id,
      listingId: listing.id,
      listingTitle: listing.title,
      kind: income ? "other" : "expense",
      label,
      amount: income ? amount : -amount,
      due,
      method: "manual",
      status: "paid",
      paidAt: new Date().toISOString(),
    },
  ]);
  return NextResponse.json({ entry }, { status: 201 });
}
