import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sameOrigin, userFromSession } from "@/lib/auth";
import { getHome } from "@/lib/homes";
import { addRequest, endDate, requestsFor } from "@/lib/requests";

export async function GET(request: NextRequest) {
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Log in to see your requests." }, { status: 401 });
  const rows = await requestsFor(user.id);
  const homes = new Map(await Promise.all([...new Set(rows.map((r) => r.listingId))].map(async (id) => [id, await getHome(id)] as const)));
  return NextResponse.json(
    {
      requests: rows.map((r) => {
        const h = homes.get(r.listingId);
        return { ...r, status: r.status ?? "sent", endDate: endDate(r), img: h?.img ?? "", area: h?.area ?? "", price: h?.price ?? 0 };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Log in to send a request." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { listingId?: string; moveIn?: string; months?: number; message?: string }
    | null;
  const home = body?.listingId ? await getHome(body.listingId) : null;
  if (!home) return NextResponse.json({ error: "We could not find that home." }, { status: 404 });

  const errors: Record<string, string> = {};
  const moveIn = body?.moveIn ?? "";
  const today = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(moveIn)) errors.moveIn = "Pick a move in date.";
  else if (moveIn < today) errors.moveIn = "That date has passed. Pick a date from today onward.";
  else if (moveIn < home.availableFrom) errors.moveIn = "That is before the home is available.";
  const months = Number(body?.months);
  const terms = home.leaseTerms.length ? home.leaseTerms : [12];
  if (home.type === "monthly" && !(months >= home.minMonths && months <= 11))
    errors.months = `Choose ${home.minMonths} to 11 months.`;
  if (home.type === "yearly" && !terms.includes(months)) errors.months = `Choose a lease of ${terms.join(", ")} months.`;
  if (!errors.moveIn && home.availableUntil && moveIn > home.availableUntil) errors.moveIn = "That is after the home's last available date.";
  if (!errors.moveIn && !errors.months && home.type === "monthly" && home.availableUntil) {
    const end = new Date(`${moveIn}T00:00:00`);
    end.setMonth(end.getMonth() + months);
    if (end.toISOString().slice(0, 10) > home.availableUntil) errors.months = "That stay runs past the home's last available date. Choose fewer months or an earlier move in.";
  }
  const message = (body?.message ?? "").trim().slice(0, 500);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const saved = await addRequest({
    userId: user.id,
    listingId: home.id,
    title: home.title,
    city: home.city,
    type: home.type,
    moveIn,
    months,
    message,
  });
  return NextResponse.json({ request: saved }, { status: 201 });
}
