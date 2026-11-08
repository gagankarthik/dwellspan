import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { TICKET_UPLOADS, findTicket } from "@/lib/ops";

/** Ticket photos are private: only the owner and the tenant who reported it. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  const { id } = await params;
  const t = await findTicket(id);
  if (!user || !t || (t.ownerId !== user.id && t.reporterId !== user.id)) return new Response("Not found", { status: 404 });
  const i = Number(request.nextUrl.searchParams.get("i") ?? 0);
  const pick = t.photos[Number.isInteger(i) ? i : 0];
  if (!pick) return new Response("Not found", { status: 404 });
  const bytes = await fs.readFile(path.join(TICKET_UPLOADS, path.basename(pick.file))).catch(() => null);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": pick.type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
