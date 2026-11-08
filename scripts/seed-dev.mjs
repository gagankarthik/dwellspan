/**
 * Dev only: seeds a test owner and renter through the real API so the owner
 * dashboard has data (listings, a request, ledger charges, a move out clean,
 * a tenant repair ticket, vendors). Run with the dev server up:
 *
 *   node scripts/seed-dev.mjs [http://localhost:3000]
 *
 * The generated test logins are written to .data/dev-accounts.json (gitignored).
 */
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3000";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("Seed only against a local dev server.");

const tag = randomBytes(3).toString("hex");
const accounts = {
  owner: { name: "Test Owner", email: `owner-${tag}@example.test`, password: randomBytes(12).toString("base64url"), role: "owner" },
  renter: { name: "Riley Renter", email: `renter-${tag}@example.test`, password: randomBytes(12).toString("base64url"), role: "renter" },
};

// 1x1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkqPtfDwAEgQHF5ZqjVwAAAABJRU5ErkJggg==", "base64");

async function call(cookie, path, init = {}) {
  const res = await fetch(BASE + path, { ...init, headers: { ...(init.headers ?? {}), ...(cookie ? { cookie } : {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} ${res.status} ${JSON.stringify(body)}`);
  return { body, cookie: res.headers.get("set-cookie")?.split(";")[0] ?? cookie };
}
const json = (method, data) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const plus = (days) => iso(new Date(today.getTime() + days * 86_400_000));

async function listing(cookie, f) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(f)) for (const x of [v].flat()) fd.append(k, String(x));
  fd.append("photos", new Blob([PNG], { type: "image/png" }), "cover.png");
  return (await call(cookie, "/api/listings", { method: "POST", body: fd })).body.listing;
}

const base = {
  propertyType: "apartment", address: "100 Test Street", area: "Downtown", state: "TX", zip: "78701",
  beds: 2, baths: 1, sqft: 900, occupants: 3, smoking: "no", phone: "5125550134", deposit: 1000,
  description: "A bright test apartment with a big kitchen, fast wifi, and a quiet bedroom for working from home.",
};

const owner = await call(null, "/api/auth/signup", json("POST", accounts.owner));
let oc = owner.cookie;
const furnished = await listing(oc, {
  ...base, title: "Test furnished loft downtown", city: "Austin", type: "monthly", minMonths: 1, price: 2400,
  availableFrom: iso(today), availableUntil: plus(330), fees: JSON.stringify([{ name: "Cleaning fee", amount: 150, frequency: "once" }, { name: "Parking fee", amount: 75, frequency: "monthly" }]),
});
const lease = await listing(oc, {
  ...base, title: "Test garden house for lease", propertyType: "house", city: "Austin", type: "yearly", leaseTerms: 12, price: 3100,
  availableFrom: iso(today), availableUntil: plus(800), fees: "[]",
});

await call(oc, "/api/vendors", json("POST", { trade: "cleaning", name: "Sparkle Home Cleaning", phone: "(512) 555 0101" }));
await call(oc, "/api/vendors", json("POST", { trade: "plumbing", name: "Austin Pipe Pros", email: "jobs@pipepros.example" }));

const renter = await call(null, "/api/auth/signup", json("POST", accounts.renter));
const rc = renter.cookie;
const r1 = (await call(rc, "/api/requests", json("POST", { listingId: furnished.id, moveIn: iso(today), months: 3, message: "Relocating for work, quiet and tidy." }))).body.request;
await call(rc, "/api/requests", json("POST", { listingId: lease.id, moveIn: plus(20), months: 12, message: "Looking for a year with my dog." }));

await call(oc, `/api/requests/${r1.id}`, json("PATCH", { decision: "accepted" }));

const fd = new FormData();
fd.append("requestId", r1.id);
fd.append("category", "plumbing");
fd.append("title", "Bathroom faucet dripping");
fd.append("details", "The bathroom sink faucet drips all night, started yesterday.");
fd.append("photos", new Blob([PNG], { type: "image/png" }), "faucet.png");
await call(rc, "/api/service-requests", { method: "POST", body: fd });

await mkdir(".data", { recursive: true });
await writeFile(".data/dev-accounts.json", JSON.stringify(accounts, null, 2));
console.log("Seeded. Test logins are in .data/dev-accounts.json");
