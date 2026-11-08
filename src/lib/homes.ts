/** Server side lookup for a home detail page: sample inventory or an owner listing. */
import { listings, type Tag } from "./listings";
import { sampleHome, type HomeDetail } from "./listingDetails";
import { findListing, listPublic, toPublic } from "./userListings";
import { PET_LABEL } from "./listings";

const TAG_LABEL: Record<Tag, string> = {
  furnished: "Fully furnished",
  schools: "Near schools",
  pets: "Pet friendly",
  workspace: "Dedicated workspace",
  parking: "Parking",
  laundry: "In unit laundry",
  utilities: "Utilities included",
  transit: "Near transit",
};
export const tagLabel = (t: Tag) => TAG_LABEL[t];

export async function getHome(id: string): Promise<HomeDetail | null> {
  const sample = sampleHome(id);
  if (sample) return sample;
  const row = await findListing(id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    area: row.area,
    city: row.city,
    type: row.type,
    price: row.price,
    minMonths: row.minMonths,
    beds: row.beds,
    baths: row.baths,
    sqft: row.sqft,
    rating: row.rating,
    reviews: row.reviews,
    tags: row.tags,
    img: row.img,
    alt: row.alt,
    description: row.description,
    photos: [{ src: row.img, alt: row.alt }, ...(toPublic(row).gallery ?? []).map((src, i) => ({ src, alt: `Photo ${i + 2} of ${row.title}` }))],
    features: [],
    highlights: [],
    availableFrom: row.availableFrom ?? row.createdAt.slice(0, 10),
    availableUntil: row.availableUntil,
    amenities: row.amenities ?? [],
    fees: row.fees ?? [],
    deposit: row.deposit ?? 0,
    depositRefundable: row.depositRefundable ?? true,
    leaseTerms: row.type === "yearly" ? (row.leaseTerms ?? [12]) : [],
    petPolicy: row.pets ? PET_LABEL[row.pets] : row.tags.includes("pets") ? "Pets welcome" : "Ask the owner about pets",
    occupants: row.occupants,
    smoking: row.smoking,
    utilitiesIncluded: row.utilitiesIncluded,
    managedBy: row.managedBy,
    questions: row.questions ?? [],
  };
}

/** Other homes in the same city, falling back to the same stay type. */
export async function nearby(home: HomeDetail, count = 4) {
  const all = [...(await listPublic()), ...listings].filter((l) => l.id !== home.id);
  const sameCity = all.filter((l) => l.city === home.city);
  const rest = all.filter((l) => l.city !== home.city && l.type === home.type);
  return [...sameCity, ...rest].slice(0, count);
}
