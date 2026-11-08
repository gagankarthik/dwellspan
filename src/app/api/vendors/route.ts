import { NextResponse, type NextRequest } from "next/server";
import { EMAIL_RE } from "@/lib/auth";
import { requireUser, noStore } from "@/lib/guard";
import { TRADES, addVendor, vendorsFor, type Trade } from "@/lib/ops";

export async function GET(request: NextRequest) {
  const g = await requireUser(request, { owner: true });
  if (g.error) return g.error;
  return NextResponse.json({ vendors: await vendorsFor(g.user.id) }, noStore);
}

export async function POST(request: NextRequest) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const s = (k: string) => String(b?.[k] ?? "").trim();
  const errors: Record<string, string> = {};
  const name = s("name").slice(0, 80);
  if (name.length < 2) errors.name = "Add the vendor's name.";
  const trade = s("trade") as Trade;
  if (!TRADES.includes(trade)) errors.trade = "Pick a trade.";
  const email = s("email").slice(0, 120);
  const phone = s("phone").replace(/[^\d+()\-\s]/g, "").slice(0, 24);
  if (email && !EMAIL_RE.test(email)) errors.email = "Check the email address.";
  if (!email && phone.replace(/\D/g, "").length < 7) errors.phone = "Add a phone number or an email.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
  const vendor = await addVendor(g.user.id, { name, trade, email, phone, defaultCleaner: Boolean(b?.defaultCleaner) });
  return NextResponse.json({ vendor }, { status: 201 });
}
