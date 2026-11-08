import { NextResponse, type NextRequest } from "next/server";
import { firstNames } from "@/lib/auth";
import { requireUser } from "@/lib/guard";
import { addLedgerEntries, chargesFor, scheduleMoveOutClean } from "@/lib/ops";
import { decideRequest, findRequest } from "@/lib/requests";
import { parseTerms } from "@/lib/terms";
import { findListing } from "@/lib/userListings";

/** Owner accepts or declines a request for one of their homes. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { decision?: string; terms?: unknown } | null;
  const decision = body?.decision;
  if (decision !== "accepted" && decision !== "declined") return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });

  const req = await findRequest(id);
  const listing = req ? await findListing(req.listingId) : null;
  if (!req || !listing || listing.ownerId !== g.user.id) return NextResponse.json({ error: "We could not find that request." }, { status: 404 });

  const res = await decideRequest(id, decision, decision === "accepted" ? parseTerms(body?.terms, req.type) : undefined);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });

  if (decision === "accepted") {
    const name = (await firstNames([req.userId]))[req.userId] ?? "Renter";
    await addLedgerEntries(chargesFor(res.row, listing, g.user.id, name));
    if (res.row.type === "monthly") await scheduleMoveOutClean(res.row, g.user.id);
  }
  return NextResponse.json({ request: res.row });
}
