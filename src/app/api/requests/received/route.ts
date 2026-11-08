import { NextResponse, type NextRequest } from "next/server";
import { firstNames } from "@/lib/auth";
import { requireUser, noStore } from "@/lib/guard";
import { allRatings, ledgerForRenter } from "@/lib/ops";
import { passportsFor, summarize } from "@/lib/passport";
import { allRequests, endDate } from "@/lib/requests";
import { todayISO } from "@/lib/store";
import { listByOwner } from "@/lib/userListings";

/**
 * Requests renters have sent for the signed in owner's homes, each with the
 * renter's record: ratings from past owners, completed stays, late payments.
 */
export async function GET(request: NextRequest) {
  const g = await requireUser(request);
  if (g.error) return g.error;
  const owned = await listByOwner(g.user.id);
  const mine = new Set(owned.map((l) => l.id));
  const rentOf = new Map(owned.map((l) => [l.id, l.price]));
  const all = await allRequests();
  const rows = all.filter((r) => mine.has(r.listingId)).reverse();
  const renterIds = [...new Set(rows.filter((r) => r.source !== "owner").map((r) => r.userId))];
  const names = await firstNames(renterIds);
  const ratings = await allRatings();
  const passports = new Map((await passportsFor(renterIds)).map((p) => [p.userId, p]));
  const today = todayISO();

  const records = Object.fromEntries(
    await Promise.all(
      renterIds.map(async (id) => {
        const theirs = ratings.filter((x) => x.renterId === id);
        const stays = all.filter((r) => r.userId === id && r.status === "accepted" && endDate(r) <= today).length;
        const late = (await ledgerForRenter(id)).filter((e) => e.status === "scheduled" && e.due < today).length;
        return [
          id,
          {
            rating: theirs.length ? Math.round((theirs.reduce((s, x) => s + x.stars, 0) / theirs.length) * 100) / 100 : null,
            ratingCount: theirs.length,
            stays,
            latePayments: late,
            reviews: theirs.slice(-2).reverse().map((x) => ({ stars: x.stars, text: x.text, context: x.context })),
          },
        ] as const;
      }),
    ),
  );

  return NextResponse.json(
    {
      requests: rows.map(({ userId, ...r }) => ({
        ...r,
        renterId: userId,
        source: r.source ?? "renter",
        status: r.status ?? "sent",
        endDate: endDate(r),
        renter: r.source === "owner" ? (r.renterName ?? "Tenant") : (names[userId] ?? "A renter"),
        record: records[userId],
        passport: r.source === "owner" ? null : summarize(passports.get(userId) ?? null, rentOf.get(r.listingId) ?? 0, r.status === "accepted"),
        rated: ratings.some((x) => x.requestId === r.id && x.ownerId === g.user.id),
      })),
    },
    noStore,
  );
}
