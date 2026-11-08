/**
 * Minimal email and password auth for Dwellspan.
 *
 * Users live in .data/users.json (git ignored). Passwords are hashed with
 * scrypt and a per user salt. Sessions are stateless signed cookies:
 * `<userId>.<expiresAt>.<hmac>`.
 *
 * Swap the JSON store for a real database before production, and set
 * AUTH_SECRET in the environment.
 */
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Role = "renter" | "owner";
export type PublicUser = { id: string; name: string; email: string; role: Role; createdAt: string };
type StoredUser = PublicUser & { salt: string; hash: string };

export const SESSION_COOKIE = "ds_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SECRET_FILE = path.join(DATA_DIR, "secret");

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

const toPublic = ({ id, name, email, role, createdAt }: StoredUser): PublicUser => ({ id, name, email, role, createdAt });
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function readUsers(): Promise<StoredUser[]> {
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, "utf8")) as StoredUser[];
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${USERS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(users, null, 2));
  await fs.rename(tmp, USERS_FILE);
}

let cachedSecret: Buffer | null = null;
async function secret(): Promise<Buffer> {
  if (process.env.AUTH_SECRET) return Buffer.from(process.env.AUTH_SECRET);
  if (cachedSecret) return cachedSecret;
  try {
    cachedSecret = Buffer.from(await fs.readFile(SECRET_FILE, "utf8"), "hex");
  } catch {
    cachedSecret = randomBytes(32);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SECRET_FILE, cachedSecret.toString("hex"));
    console.warn("[auth] AUTH_SECRET is not set. Generated a local secret in .data/secret for development.");
  }
  return cachedSecret;
}

export async function createUser(input: { name: string; email: string; password: string; role: Role }) {
  const users = await readUsers();
  const email = normalizeEmail(input.email);
  if (users.some((u) => u.email === email)) return { error: "exists" as const };
  const salt = randomBytes(16);
  const hash = await scrypt(input.password, salt);
  const user: StoredUser = {
    id: randomBytes(12).toString("hex"),
    name: input.name.trim(),
    email,
    role: input.role,
    createdAt: new Date().toISOString(),
    salt: salt.toString("hex"),
    hash: hash.toString("hex"),
  };
  users.push(user);
  await writeUsers(users);
  return { user: toPublic(user) };
}

export async function verifyUser(emailInput: string, password: string): Promise<PublicUser | null> {
  const email = normalizeEmail(emailInput);
  const user = (await readUsers()).find((u) => u.email === email);
  if (!user) {
    await scrypt(password, randomBytes(16)); // keep timing similar for unknown emails
    return null;
  }
  const hash = await scrypt(password, Buffer.from(user.salt, "hex"));
  return timingSafeEqual(hash, Buffer.from(user.hash, "hex")) ? toPublic(user) : null;
}

async function sign(payload: string) {
  return createHmac("sha256", await secret()).update(payload).digest("base64url");
}

export async function createSessionToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

export async function userFromSession(token: string | undefined): Promise<PublicUser | null> {
  if (!token) return null;
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig) return null;
  const expected = Buffer.from(await sign(`${id}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  const user = (await readUsers()).find((u) => u.id === id);
  return user ? toPublic(user) : null;
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/** Rejects cross site form posts: the Origin header, when present, must match the host. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function setRole(userId: string, role: Role) {
  const users = await readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user || user.role === role) return;
  user.role = role;
  await writeUsers(users);
}

export async function userExists(email: string) {
  const e = normalizeEmail(email);
  return (await readUsers()).some((u) => u.email === e);
}

/** First names only, for showing renters to owners. */
export async function firstNames(ids: string[]) {
  const users = await readUsers();
  return Object.fromEntries(
    users.filter((u) => ids.includes(u.id)).map((u) => [u.id, u.name.split(/\s+/)[0] ?? "Renter"]),
  ) as Record<string, string>;
}
