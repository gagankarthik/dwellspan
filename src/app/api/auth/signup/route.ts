import { NextResponse, type NextRequest } from "next/server";
import { EMAIL_RE, SESSION_COOKIE, createSessionToken, createUser, sameOrigin, sessionCookie, type Role } from "@/lib/auth";

type Body = { name?: string; email?: string; password?: string; role?: string };

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as Body | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";
  const role: Role = body?.role === "owner" ? "owner" : "renter";

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your name.";
  else if (name.length > 80) errors.name = "Use 80 characters or fewer.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email, like you@example.com.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  else if (password.length > 200) errors.password = "Use 200 characters or fewer.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const result = await createUser({ name, email, password, role });
  if ("error" in result) {
    return NextResponse.json(
      { errors: { email: "An account with this email already exists. Log in instead." } },
      { status: 409 },
    );
  }
  const res = NextResponse.json({ user: result.user }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(result.user.id), sessionCookie);
  return res;
}
