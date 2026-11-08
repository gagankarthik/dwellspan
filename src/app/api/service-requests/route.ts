import { NextResponse, type NextRequest } from "next/server";
import { requireUser, noStore } from "@/lib/guard";
import { CATEGORIES, createTicket, ticketsForOwner, ticketsForReporter, type Category, type Priority, type Ticket } from "@/lib/ops";
import { endDate, findRequest, requestsFor } from "@/lib/requests";
import { todayISO } from "@/lib/store";
import { findListing, sniffImage } from "@/lib/userListings";

const MAX_PHOTOS = 3;
const MAX_BYTES = 5 * 1024 * 1024;

const photoUrls = (t: Ticket) => t.photos.map((_, i) => `/api/service-requests/${t.id}/photo?i=${i}`);

/** Strip owner only fields before showing a ticket to the tenant. */
function forTenant(t: Ticket) {
  const { ownerId, vendorId, cost, accessCode, ...rest } = t;
  void ownerId;
  void vendorId;
  void cost;
  void accessCode;
  return { ...rest, photos: photoUrls(t) };
}
const forOwner = (t: Ticket) => ({ ...t, photos: photoUrls(t) });

export async function GET(request: NextRequest) {
  const g = await requireUser(request);
  if (g.error) return g.error;
  if (g.user.role === "owner") return NextResponse.json({ tickets: (await ticketsForOwner(g.user.id)).map(forOwner) }, noStore);
  const today = todayISO();
  const homes = (await requestsFor(g.user.id))
    .filter((r) => r.status === "accepted" && endDate(r) >= today)
    .map((r) => ({ requestId: r.id, title: r.title, city: r.city, moveIn: r.moveIn, endDate: endDate(r) }));
  return NextResponse.json({ tickets: (await ticketsForReporter(g.user.id)).map(forTenant), homes }, noStore);
}

/** Owners open a ticket for a unit; tenants report a repair for the home they rent. */
export async function POST(request: NextRequest) {
  const g = await requireUser(request, { write: true });
  if (g.error) return g.error;
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Send the form again." }, { status: 400 });
  const str = (k: string) => String(form.get(k) ?? "").trim();

  const errors: Record<string, string> = {};
  const category = str("category") as Category;
  if (!CATEGORIES.includes(category)) errors.category = "Pick a category.";
  const priority = (["low", "normal", "urgent"].includes(str("priority")) ? str("priority") : "normal") as Priority;
  const title = str("title").slice(0, 80);
  if (title.length < 3) errors.title = "Add a short title, like Kitchen sink leaking.";
  const details = str("details").slice(0, 1000);
  if (details.length < 10) errors.details = "Describe the problem in a sentence or two.";

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) errors.photos = `Add up to ${MAX_PHOTOS} photos.`;
  const photos: { bytes: Buffer; ext: string; mime: string }[] = [];
  for (const f of files.slice(0, MAX_PHOTOS)) {
    if (f.size > MAX_BYTES) {
      errors.photos = "Each photo must be under 5 MB.";
      break;
    }
    const bytes = Buffer.from(await f.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) {
      errors.photos = "Photos must be JPG, PNG, or WebP.";
      break;
    }
    photos.push({ bytes, ...kind });
  }

  const tenant = g.user.role !== "owner";
  let target: { ownerId: string; listingId: string; listingTitle: string; requestId?: string } | null = null;
  if (!tenant) {
    const l = await findListing(str("listingId"));
    if (!l || l.ownerId !== g.user.id) errors.listingId = "Pick one of your properties.";
    else target = { ownerId: l.ownerId, listingId: l.id, listingTitle: l.title };
  } else {
    const r = await findRequest(str("requestId"));
    const l = r ? await findListing(r.listingId) : null;
    if (!r || !l || r.userId !== g.user.id || r.status !== "accepted" || endDate(r) < todayISO())
      errors.requestId = "Pick the home you are renting.";
    else target = { ownerId: l.ownerId, listingId: l.id, listingTitle: l.title, requestId: r.id };
  }
  if (Object.keys(errors).length || !target) return NextResponse.json({ errors }, { status: 400 });

  const first = g.user.name.split(/\s+/)[0];
  const ticket = await createTicket(
    {
      ...target,
      category,
      priority,
      title,
      details,
      reportedBy: tenant ? "tenant" : "owner",
      reporterId: g.user.id,
      reporterName: first,
      source: "manual",
      // Tenant tickets wait for the owner's approval; the owner's own are approved already.
      status: tenant ? "pending" : "approved",
    },
    photos,
    tenant ? `Reported by ${first}` : "Opened by owner",
  );
  return NextResponse.json({ ticket: tenant ? forTenant(ticket) : forOwner(ticket) }, { status: 201 });
}
