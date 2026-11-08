import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, createSessionToken, sameOrigin, sessionCookie, verifyUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const user = await verifyUser(email, password);
  if (!user) {
    return NextResponse.json({ error: "That email and password do not match an account." }, { status: 401 });
  }
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(user.id), sessionCookie);
  return res;
}
