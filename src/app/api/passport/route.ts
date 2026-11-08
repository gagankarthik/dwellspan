import { NextResponse, type NextRequest } from "next/server";
import { noStore, requireUser } from "@/lib/guard";
import { getPassport, isVerified, parsePassport, savePassport } from "@/lib/passport";

/** The signed in renter's Passport, or null if they have not started one. */
export async function GET(request: NextRequest) {
  const g = await requireUser(request);
  if (g.error) return g.error;
  const passport = await getPassport(g.user.id);
  return NextResponse.json({ passport, verified: isVerified(passport) }, noStore);
}

/** Save the profile as a draft. Verification is a separate step. */
export async function PUT(request: NextRequest) {
  const g = await requireUser(request, { write: true });
  if (g.error) return g.error;
  if (g.user.role !== "renter") return NextResponse.json({ error: "Passports are for renter accounts." }, { status: 403 });
  const { input } = parsePassport(await request.json().catch(() => null), false);
  const passport = await savePassport(g.user.id, input);
  return NextResponse.json({ passport, verified: isVerified(passport) }, noStore);
}
