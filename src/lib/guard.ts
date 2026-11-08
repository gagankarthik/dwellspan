/** Shared checks for API routes. */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sameOrigin, userFromSession, type PublicUser } from "./auth";

type Guard = { user: PublicUser; error?: never } | { user?: never; error: NextResponse };

export async function requireUser(request: NextRequest, opts: { owner?: boolean; write?: boolean } = {}): Promise<Guard> {
  if (opts.write && !sameOrigin(request)) return { error: NextResponse.json({ error: "Request blocked." }, { status: 403 }) };
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return { error: NextResponse.json({ error: "Log in first." }, { status: 401 }) };
  if (opts.owner && user.role !== "owner") return { error: NextResponse.json({ error: "Owner accounts only." }, { status: 403 }) };
  return { user };
}

export const noStore = { headers: { "Cache-Control": "no-store" } };
