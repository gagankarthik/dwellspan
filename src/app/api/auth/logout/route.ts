import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sameOrigin, sessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookie, maxAge: 0 });
  return res;
}
