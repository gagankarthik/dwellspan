import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/guard";
import { removeVendor, setDefaultCleaner } from "@/lib/ops";

/** Make this cleaner the one move out cleans go to. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const ok = await setDefaultCleaner(g.user.id, (await params).id);
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Only cleaners can take move out cleans." }, { status: 400 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(request, { owner: true, write: true });
  if (g.error) return g.error;
  const ok = await removeVendor(g.user.id, (await params).id);
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "We could not find that vendor." }, { status: 404 });
}
