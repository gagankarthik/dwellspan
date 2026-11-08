import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sameOrigin, userFromSession } from "@/lib/auth";
import { deleteListing } from "@/lib/userListings";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const ok = await deleteListing(user.id, id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "We could not find that listing on your account." }, { status: 404 });
}
