import { NextResponse, type NextRequest } from "next/server";
import { noStore, requireUser } from "@/lib/guard";
import { isVerified, parsePassport, savePassport, verifyPassport } from "@/lib/passport";

/**
 * Save the profile and run the checks. Checks are simulated for now; see
 * lib/passport.ts. The one time fee is not charged until payments are live.
 */
export async function POST(request: NextRequest) {
  const g = await requireUser(request, { write: true });
  if (g.error) return g.error;
  if (g.user.role !== "renter") return NextResponse.json({ error: "Passports are for renter accounts." }, { status: 403 });
  const { input, errors } = parsePassport(await request.json().catch(() => null), true);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
  await savePassport(g.user.id, input);
  const passport = await verifyPassport(g.user.id);
  return NextResponse.json({ passport, verified: isVerified(passport) }, noStore);
}
