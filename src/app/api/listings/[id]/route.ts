import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sameOrigin, userFromSession } from "@/lib/auth";
import { parseQuestions } from "@/lib/screening";
import { deleteListing, setListingQuestions } from "@/lib/userListings";

/** Owner edits to a live listing. Today: the screening questions renters answer. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { questions?: unknown } | null;
  const { questions, errors } = parseQuestions(body?.questions);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
  const listing = await setListingQuestions(user.id, id, questions);
  if (!listing) return NextResponse.json({ error: "We could not find that listing on your account." }, { status: 404 });
  return NextResponse.json({ listing });
}

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
