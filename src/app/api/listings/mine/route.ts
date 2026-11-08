import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { listByOwner, toPublic } from "@/lib/userListings";

export async function GET(request: NextRequest) {
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Log in to see your listings." }, { status: 401 });
  const rows = await listByOwner(user.id);
  return NextResponse.json(
    { listings: rows.map((r) => ({ ...toPublic(r), createdAt: r.createdAt })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
