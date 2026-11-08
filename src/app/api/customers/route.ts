import { NextResponse, type NextRequest } from "next/server";
import { EMAIL_RE } from "@/lib/auth";
import { requireUser } from "@/lib/guard";
import { addLedgerEntries, chargesFor, scheduleMoveOutClean } from "@/lib/ops";
import { addOwnerTenancy, endDate } from "@/lib/requests";
import { newId, todayISO } from "@/lib/store";
import { parseTerms } from "@/lib/terms";
import { findListing } from "@/lib/userListings";

/**
 * Owner adds a customer found outside Dwellspan: a tenant already living in
 * the unit, or one about to move in. Blocks the calendar and schedules
 * charges by the chosen payment terms.
 */
export async function POST(request: NextRequest) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const s = (k: string) => String(b?.[k] ?? "").trim();
  const errors: Record<string, string> = {};

  const name = s("name").slice(0, 80);
  if (name.length < 2) errors.name = "Enter the customer's name.";
  const email = s("email").slice(0, 120);
  if (email && !EMAIL_RE.test(email)) errors.email = "Check the email address.";
  const phone = s("phone").replace(/[^\d+()\-\s]/g, "").slice(0, 24);

  const listing = await findListing(s("listingId"));
  if (!listing || listing.ownerId !== g.user.id) errors.listingId = "Pick one of your properties.";

  const moveIn = s("moveIn");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(moveIn)) errors.moveIn = "Pick the move in date.";
  const months = Number(b?.months);
  if (!Number.isInteger(months) || months < 1 || months > 60) errors.months = "Choose 1 to 60 months.";
  const rent = Math.round(Number(b?.rent) * 100) / 100;
  if (!(rent >= 1 && rent <= 50000)) errors.rent = "Enter rent between $1 and $50,000.";
  const deposit = Math.round(Number(b?.deposit) || 0);
  if (deposit < 0 || deposit > 50000) errors.deposit = "Enter a deposit up to $50,000.";
  if (Object.keys(errors).length || !listing) return NextResponse.json({ errors }, { status: 400 });

  const type = listing.type;
  const terms = parseTerms(b?.terms, type);
  const res = await addOwnerTenancy({
    userId: `manual-${newId()}`,
    listingId: listing.id,
    title: listing.title,
    city: listing.city,
    type,
    moveIn,
    months,
    message: "",
    terms,
    renterName: name,
    email,
    phone,
    notes: s("notes").slice(0, 500),
    rent,
  });
  if (!res.ok) return NextResponse.json({ errors: { moveIn: res.error } }, { status: 409 });

  await addLedgerEntries(
    chargesFor(res.row, { price: rent, fees: listing.fees, deposit }, g.user.id, name, {
      terms,
      rent,
      deposit,
      paidBefore: b?.pastPaid === false ? undefined : todayISO(),
    }),
  );
  if (type === "monthly" && endDate(res.row) >= todayISO()) await scheduleMoveOutClean(res.row, g.user.id);
  return NextResponse.json({ customer: res.row }, { status: 201 });
}
