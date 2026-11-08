import { NextResponse, type NextRequest } from "next/server";
import { EMAIL_RE, sameOrigin, userExists } from "@/lib/auth";

/** Tells the sign in dialog whether to ask for a password or for sign up details. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim() ?? "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email, like you@example.com." }, { status: 400 });
  }
  return NextResponse.json({ exists: await userExists(email) }, { headers: { "Cache-Control": "no-store" } });
}
