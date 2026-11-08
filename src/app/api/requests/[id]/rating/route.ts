import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/guard";
import { addRating } from "@/lib/ops";
import { findRequest } from "@/lib/requests";
import { todayISO } from "@/lib/store";
import { findListing } from "@/lib/userListings";

/** Owner rates the renter once the stay or lease has started. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const { id } = await params;
  const req = await findRequest(id);
  const listing = req ? await findListing(req.listingId) : null;
  if (!req || !listing || listing.ownerId !== g.user.id) return NextResponse.json({ error: "We could not find that request." }, { status: 404 });
  if (req.status !== "accepted") return NextResponse.json({ error: "You can rate renters you accepted." }, { status: 400 });
  if (req.moveIn > todayISO()) return NextResponse.json({ error: "You can rate this renter once they move in." }, { status: 400 });

  const body = (await request.json().catch(() => null)) as { stars?: number; text?: string } | null;
  const stars = Number(body?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return NextResponse.json({ error: "Pick 1 to 5 stars." }, { status: 400 });
  const months = req.months;
  const row = await addRating({
    ownerId: g.user.id,
    renterId: req.userId,
    requestId: req.id,
    stars,
    text: (body?.text ?? "").trim().slice(0, 400),
    context: `Owner in ${listing.city}, ${months} month ${req.type === "yearly" ? "lease" : "stay"}`,
  });
  if (!row) return NextResponse.json({ error: "You already rated this renter for this stay." }, { status: 409 });
  return NextResponse.json({ rating: row }, { status: 201 });
}
