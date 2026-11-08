import { NextResponse, type NextRequest } from "next/server";
import { AMENITY_KEYS } from "@/lib/amenities";
import { SESSION_COOKIE, sameOrigin, setRole, userFromSession } from "@/lib/auth";
import { FEE_TYPES, LEASE_TERMS, UTILITIES, type Fee, type PetPolicy, type SmokingPolicy, type StayType, type Tag } from "@/lib/listings";
import { STATE_CODES } from "@/lib/usStates";
import { PROPERTY_TYPES, TAGS, createListing, listPublic, sniffImage, toPublic, type PropertyType } from "@/lib/userListings";

const MAX_PHOTO = 8 * 1024 * 1024;
const MAX_PHOTOS = 8;

export async function GET() {
  return NextResponse.json({ listings: await listPublic() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Log in to publish a listing." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "We could not read that upload. Try again." }, { status: 400 });
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const num = (k: string) => Number(form.get(k));

  const errors: Record<string, string> = {};
  const title = str("title");
  const description = str("description");
  const propertyType = str("propertyType") as PropertyType;
  const address = str("address");
  const unit = str("unit").slice(0, 20);
  const area = str("area");
  const cityName = str("city");
  const state = str("state").toUpperCase();
  const zip = str("zip");
  const type = str("type") as StayType;
  const leaseTerms = form
    .getAll("leaseTerms")
    .map(Number)
    .filter((n) => (LEASE_TERMS as readonly number[]).includes(n))
    .sort((a, b) => a - b);
  const minMonths = type === "yearly" ? (leaseTerms[0] ?? 12) : num("minMonths");
  const price = num("price");
  const beds = num("beds");
  const baths = num("baths");
  const sqft = num("sqft");
  const amenities = Array.from(new Set(form.getAll("amenities").map(String))).filter((k) => (AMENITY_KEYS as string[]).includes(k));
  const petPolicy = (["none", "cats", "dogs", "both"].includes(str("petPolicy")) ? str("petPolicy") : "none") as PetPolicy;
  const petsAllowed = petPolicy !== "none";
  const occupants = num("occupants");
  const smoking = str("smoking") as SmokingPolicy;
  const utilKeys: string[] = UTILITIES.map(([k]) => k);
  const utilitiesIncluded = Array.from(new Set(form.getAll("utilities").map(String))).filter((u) => utilKeys.includes(u));
  const phoneDigits = str("phone").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  const contactPref = (["email", "phone", "text"].includes(str("contactPref")) ? str("contactPref") : "email") as "email" | "phone" | "text";
  const manager = str("manager") === "manager";
  const company = str("company").slice(0, 60);
  const deposit = num("deposit") || 0;
  const depositRefundable = str("depositRefundable") !== "no";
  const availableFrom = str("availableFrom");
  const availableUntil = str("availableUntil");
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date().toISOString().slice(0, 10);

  let fees: Fee[] = [];
  try {
    const raw = JSON.parse(str("fees") || "[]") as Fee[];
    fees = raw.slice(0, 10).map((f) => ({
      name: String(f.name ?? "").trim().slice(0, 40),
      amount: Math.round(Number(f.amount)),
      frequency: f.frequency === "monthly" ? "monthly" : "once",
    }));
  } catch {
    errors.fees = "We could not read the fees. Check each row and try again.";
  }
  if (fees.some((f) => !f.name || !(f.amount >= 1 && f.amount <= 10000)))
    errors.fees = "Each fee needs a name and an amount between $1 and $10,000.";
  void FEE_TYPES;

  if (!PROPERTY_TYPES.includes(propertyType)) errors.propertyType = "Choose a property type.";
  if (type !== "monthly" && type !== "yearly") errors.type = "Choose how you want to rent it.";
  if (type === "monthly" && !(minMonths >= 1 && minMonths <= 11)) errors.minMonths = "Pick a minimum stay of 1 to 11 months.";
  if (type === "yearly" && leaseTerms.length === 0) errors.leaseTerms = "Choose at least one lease length.";
  if (address.length < 5) errors.address = "Enter the street address.";
  if (!area) errors.area = "Enter the neighborhood.";
  if (!/^[A-Za-z .'’-]{2,40}$/.test(cityName)) errors.city = "Enter the city.";
  if (!STATE_CODES.includes(state)) errors.state = "Choose a state.";
  if (!/^\d{5}$/.test(zip)) errors.zip = "Enter a 5 digit ZIP code.";
  if (!(beds >= 0 && beds <= 10)) errors.beds = "Bedrooms must be between 0 and 10.";
  if (!(baths >= 1 && baths <= 8)) errors.baths = "Bathrooms must be between 1 and 8.";
  if (!(sqft >= 150 && sqft <= 20000)) errors.sqft = "Enter a size between 150 and 20,000 sqft.";
  if (title.length < 8 || title.length > 60) errors.title = "Use 8 to 60 characters.";
  if (description.length < 40 || description.length > 600) errors.description = "Use 40 to 600 characters.";
  if (!(price >= 300 && price <= 50000)) errors.price = "Enter a monthly rent between $300 and $50,000.";
  if (!(deposit >= 0 && deposit <= 50000)) errors.deposit = "Enter a deposit between $0 and $50,000.";
  if (!(occupants >= 1 && occupants <= 16)) errors.occupants = "Allow between 1 and 16 occupants.";
  if (!["no", "outside", "yes"].includes(smoking)) errors.smoking = "Choose a smoking policy.";
  if (phoneDigits.length !== 10) errors.phone = "Enter a 10 digit US phone number.";
  if (manager && company.trim().length < 2) errors.company = "Enter the management company name.";
  if (!ISO.test(availableFrom)) errors.availableFrom = "Pick the first date it is available.";
  else if (availableFrom < today) errors.availableFrom = "The start date has passed. Pick today or later.";
  if (!ISO.test(availableUntil)) errors.availableUntil = "Pick the last date it is available.";
  else if (ISO.test(availableFrom) && availableUntil <= availableFrom) errors.availableUntil = "The end date must be after the start date.";
  else if (type === "monthly" && ISO.test(availableFrom)) {
    const end = new Date(`${availableFrom}T00:00:00`);
    end.setMonth(end.getMonth() + minMonths);
    if (new Date(`${availableUntil}T00:00:00`) < end) errors.availableUntil = `Leave at least ${minMonths} ${minMonths === 1 ? "month" : "months"}, your minimum stay.`;
  }

  // Photos: the first is the cover. Accepts "photos" (many) or the older single "photo".
  const files = [...form.getAll("photos"), ...form.getAll("photo")].filter((f): f is File => f instanceof File && f.size > 0);
  const photos: { bytes: Buffer; ext: string; mime: string }[] = [];
  if (files.length === 0) errors.photo = "Add at least one photo.";
  else if (files.length > MAX_PHOTOS) errors.photo = `Add up to ${MAX_PHOTOS} photos.`;
  else {
    for (const file of files) {
      if (file.size > MAX_PHOTO) {
        errors.photo = `${file.name} is over 8 MB. Try a smaller one.`;
        break;
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const kind = sniffImage(bytes);
      if (!kind) {
        errors.photo = `${file.name} is not a JPG, PNG, or WebP photo.`;
        break;
      }
      photos.push({ bytes, ...kind });
    }
  }
  if (Object.keys(errors).length || photos.length === 0) return NextResponse.json({ errors }, { status: 400 });

  // Older search tags stay in sync with the catalog so every filter keeps working.
  const tags = TAGS.filter((t: Tag) => (t === "pets" ? petsAllowed : amenities.includes(t === "laundry" ? "laundry" : t)));

  const listing = await createListing(
    user.id,
    {
      title,
      description,
      propertyType,
      address,
      unit,
      area,
      city: `${cityName}, ${state}`,
      state,
      zip,
      type,
      minMonths,
      leaseTerms: type === "yearly" ? leaseTerms : undefined,
      price: Math.round(price),
      beds,
      baths,
      sqft: Math.round(sqft),
      tags,
      amenities,
      fees,
      deposit: Math.round(deposit),
      depositRefundable,
      availableFrom,
      availableUntil,
      occupants,
      smoking,
      pets: petPolicy,
      utilitiesIncluded,
      managedBy: manager ? company.trim() : undefined,
      phone: phoneDigits,
      contactPref,
    },
    photos,
  );
  await setRole(user.id, "owner");
  return NextResponse.json({ listing: toPublic(listing) }, { status: 201 });
}
