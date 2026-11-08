import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ user }, { status: user ? 200 : 401, headers: { "Cache-Control": "no-store" } });
}
