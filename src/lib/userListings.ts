/**
 * Listings created by owners through /list-your-property.
 * Stored in .data/listings.json, photos in .data/uploads. Swap for a database
 * and object storage before production.
 */
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Fee, Listing, PetPolicy, SmokingPolicy, StayType, Tag } from "./listings";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "listings.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const PROPERTY_TYPES = ["apartment", "house", "townhouse", "unique"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export const TAGS: Tag[] = ["furnished", "schools", "pets", "workspace", "parking", "laundry", "utilities", "transit"];

export type StoredListing = Listing & {
  ownerId: string;
  createdAt: string;
  description: string;
  propertyType: PropertyType;
  address: string; // private, never sent to renters
  unit?: string; // private
  state?: string;
  zip?: string; // private
  photo: string; // cover file name in UPLOAD_DIR
  photoType: string;
  photos?: { file: string; type: string }[]; // every photo, cover first
  phone?: string; // private
  contactPref?: "email" | "phone" | "text"; // private
};

async function readAll(): Promise<StoredListing[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as StoredListing[];
  } catch {
    return [];
  }
}

async function writeAll(rows: StoredListing[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
  await fs.rename(tmp, FILE);
}

/** What renters may see. */
export function toPublic(l: StoredListing): Listing & { description: string; propertyType: PropertyType } {
  const { id, title, area, city, type, price, minMonths, beds, baths, sqft, rating, reviews, tags, img, alt, description, propertyType } = l;
  const { leaseTerms, amenities, fees, deposit, depositRefundable, availableFrom, availableUntil, occupants, smoking, pets, utilitiesIncluded, managedBy } = l;
  const gallery = (l.photos ?? []).slice(1).map((_, i) => `/api/listings/${l.id}/photo?i=${i + 1}`);
  return {
    id, title, area, city, type, price, minMonths, beds, baths, sqft, rating, reviews, tags, img, alt, description, propertyType,
    leaseTerms, amenities, fees, deposit, depositRefundable, availableFrom, availableUntil,
    gallery, occupants, smoking, pets, utilitiesIncluded, managedBy,
  };
}

export async function listPublic() {
  return (await readAll()).map(toPublic).reverse();
}

export async function listByOwner(ownerId: string) {
  return (await readAll()).filter((l) => l.ownerId === ownerId).reverse();
}

export async function findListing(id: string) {
  return (await readAll()).find((l) => l.id === id) ?? null;
}

export type NewListing = {
  title: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  unit: string;
  state: string;
  zip: string;
  leaseTerms?: number[];
  amenities: string[];
  fees: Fee[];
  deposit: number;
  depositRefundable: boolean;
  availableFrom: string;
  availableUntil: string;
  occupants: number;
  smoking: SmokingPolicy;
  pets: PetPolicy;
  utilitiesIncluded: string[];
  managedBy?: string;
  phone: string;
  contactPref: "email" | "phone" | "text";
  area: string;
  city: string;
  type: StayType;
  minMonths: number;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  tags: Tag[];
};

export async function createListing(ownerId: string, input: NewListing, photos: { bytes: Buffer; ext: string; mime: string }[]) {
  const photo = photos[0];
  const id = `u-${randomBytes(8).toString("hex")}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const saved = await Promise.all(
    photos.map(async (ph, i) => {
      const name = `${id}-${i}.${ph.ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, name), ph.bytes);
      return { file: name, type: ph.mime };
    }),
  );
  const file = saved[0].file;
  const row: StoredListing = {
    ...input,
    id,
    ownerId,
    createdAt: new Date().toISOString(),
    rating: 0,
    reviews: 0,
    img: `/api/listings/${id}/photo`,
    alt: `Cover photo of ${input.title}`,
    photo: file,
    photoType: photo.mime,
    photos: saved,
  };
  const rows = await readAll();
  rows.push(row);
  await writeAll(rows);
  return row;
}

export async function deleteListing(ownerId: string, id: string) {
  const rows = await readAll();
  const row = rows.find((l) => l.id === id);
  if (!row || row.ownerId !== ownerId) return false;
  await writeAll(rows.filter((l) => l.id !== id));
  for (const f of row.photos?.map((x) => x.file) ?? [row.photo]) await fs.rm(path.join(UPLOAD_DIR, f), { force: true });
  return true;
}

/** Checks the file's first bytes, not just its declared type. */
export function sniffImage(bytes: Buffer): { ext: string; mime: string } | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: "png", mime: "image/png" };
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
    return { ext: "webp", mime: "image/webp" };
  return null;
}
