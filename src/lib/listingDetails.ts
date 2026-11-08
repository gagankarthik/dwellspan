// Sample detail content for the demo inventory. Replace with live data.
import { amenitiesOf } from "./amenities";
import { listings, type Fee, type Listing } from "./listings";

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=70`;

// Verified interior shots reused across galleries.
const ROOMS = {
  bedroom: { src: u("1505691938895-1758d7feb511"), alt: "Bedroom with a made bed beside a bright window" },
  living: { src: u("1493809842364-78817add7ffb"), alt: "Living room with a sofa and plants" },
  kitchen: { src: u("1484154218962-a197022b5858"), alt: "White kitchen with wood counters" },
  lounge: { src: u("1560448204-e02f11c3d0e2"), alt: "Living area with a dining corner" },
  loft: { src: u("1502672260266-1c1ef2d93688"), alt: "Loft living room with tall windows" },
  dining: { src: u("1522708323590-d24dbb6b0267"), alt: "Open plan dining and kitchen" },
  reading: { src: u("1586023492125-27b2c045efd7"), alt: "Reading corner with an armchair" },
};
type Photo = { src: string; alt: string };

export type HomeDetail = Listing & {
  description: string;
  photos: Photo[];
  features: string[];
  highlights: { title: string; body: string }[];
  offer?: string;
  availableFrom: string;
  availableUntil?: string;
  deposit: number;
  depositRefundable: boolean;
  fees: Fee[];
  leaseTerms: number[];
  petPolicy: string;
};

const extra: Record<
  string,
  Omit<HomeDetail, keyof Listing | "photos" | "fees" | "depositRefundable" | "leaseTerms"> & {
    deposit: number;
    availableFrom: string;
    rooms: (keyof typeof ROOMS)[];
  }
> = {
  "pearl-loft": {
    description:
      "A corner loft with fourteen foot ceilings and a wall of factory windows. Walk to Powell's Books, the streetcar, and the riverfront in under ten minutes. Fully furnished with a queen bed, a real desk, and a kitchen stocked for cooking.",
    rooms: ["loft", "bedroom", "kitchen", "reading"],
    features: ["Gigabit wifi", "Dishwasher", "Central air", "Keyless entry", "Linens and towels", "Bike storage"],
    highlights: [
      { title: "Work ready", body: "A standing desk and a second monitor are already set up." },
      { title: "Walkable", body: "Grocery, coffee, and the streetcar are all on the same block." },
      { title: "Easy move in", body: "Self check in with a door code on your first day." },
    ],
    offer: "Book 3 months or more and save $250 on your first month.",
    availableFrom: "2026-12-01",
    deposit: 500,
    petPolicy: "No pets",
  },
  "raleigh-yard": {
    description:
      "A two bedroom home with a fenced backyard on a quiet Five Points street. Hardwood floors throughout, an updated kitchen, and a washer and dryer in the unit. Zoned for Underwood Elementary.",
    rooms: ["living", "kitchen", "bedroom", "dining"],
    features: ["Fenced yard", "Washer and dryer", "Dishwasher", "Central air", "Off street parking", "Storage shed"],
    highlights: [
      { title: "Room for a dog", body: "A fenced yard and a pet door to the back patio." },
      { title: "School zone", body: "Zoned for Underwood Elementary, a six minute walk." },
      { title: "Sign online", body: "Apply, sign, and set up autopay in the app." },
    ],
    availableFrom: "2027-01-15",
    deposit: 2640,
    petPolicy: "Dogs and cats welcome, $45 a month pet rent",
  },
  "slu-suite": {
    description:
      "A furnished one bedroom built for corporate stays, two blocks from Lake Union. Utilities, wifi, and biweekly cleaning are included. The building has a gym, a roof deck, and a staffed lobby.",
    rooms: ["dining", "bedroom", "lounge", "kitchen"],
    features: ["Utilities included", "Biweekly cleaning", "Building gym", "Roof deck", "Staffed lobby", "In unit laundry"],
    highlights: [
      { title: "All inclusive", body: "Rent covers utilities, wifi, and cleaning every other week." },
      { title: "Near the offices", body: "A ten minute walk to most South Lake Union campuses." },
      { title: "Flexible", body: "Extend month to month after your first three months." },
    ],
    offer: "Free parking for the first month on stays of 6 months or more.",
    availableFrom: "2026-11-20",
    deposit: 750,
    petPolicy: "Cats welcome",
  },
  "denver-craftsman": {
    description:
      "A 1920s craftsman with original built ins, a wide front porch, and a finished basement. Two blocks from Washington Park and zoned for Steele Elementary.",
    rooms: ["living", "dining", "bedroom", "kitchen"],
    features: ["Finished basement", "Front porch", "Washer and dryer", "Garage parking", "Gas range", "Fenced yard"],
    highlights: [
      { title: "Steps to the park", body: "Washington Park is a two block walk." },
      { title: "Top school zone", body: "Zoned for Steele Elementary." },
      { title: "Space to grow", body: "Three bedrooms plus a finished basement." },
    ],
    availableFrom: "2027-02-01",
    deposit: 2985,
    petPolicy: "Dogs welcome, $45 a month pet rent",
  },
  "chicago-studio": {
    description:
      "A furnished studio on a high floor with skyline views from the bed. Utilities and wifi included, and the Morgan stop on the Green and Pink lines is a four minute walk.",
    rooms: ["bedroom", "lounge", "kitchen", "reading"],
    features: ["Skyline views", "Utilities included", "Building gym", "Package room", "Keyless entry", "Linens and towels"],
    highlights: [
      { title: "Transit at the door", body: "The Morgan L stop is four minutes away." },
      { title: "One bill", body: "Rent includes utilities and wifi." },
      { title: "Short minimum", body: "Book as little as one month." },
    ],
    offer: "Move in by December 15 and get $200 off your first month.",
    availableFrom: "2026-11-15",
    deposit: 400,
    petPolicy: "No pets",
  },
  "nashville-townhouse": {
    description:
      "A two story townhouse a short walk from the shops and restaurants on Gallatin Avenue. Private patio, a reserved parking spot, and laundry in the unit.",
    rooms: ["living", "kitchen", "bedroom", "dining"],
    features: ["Private patio", "Reserved parking", "Washer and dryer", "Dishwasher", "Central air", "Walk in closet"],
    highlights: [
      { title: "Neighborhood life", body: "Coffee, music venues, and dinner within a few blocks." },
      { title: "Pet friendly", body: "Dogs and cats welcome with a small monthly fee." },
      { title: "Two floors", body: "Bedrooms upstairs, living space down." },
    ],
    availableFrom: "2027-01-01",
    deposit: 2410,
    petPolicy: "Dogs and cats welcome, $35 a month pet rent",
  },
  "austin-garden": {
    description:
      "A garden level one bedroom in Hyde Park with a private entrance and a desk nook by the window. Furnished, pet friendly, and a short ride to the UT campus.",
    rooms: ["living", "bedroom", "kitchen", "reading"],
    features: ["Private entrance", "Desk nook", "Ceiling fans", "Dishwasher", "Street parking", "Shared garden"],
    highlights: [
      { title: "Bring your dog", body: "A shared garden and dog friendly streets." },
      { title: "Quiet work spot", body: "A desk nook with natural light all day." },
      { title: "Near campus", body: "A ten minute ride to the University of Texas." },
    ],
    availableFrom: "2026-12-10",
    deposit: 500,
    petPolicy: "Dogs welcome",
  },
  "cherry-creek": {
    description:
      "A modern four bedroom home with an open kitchen, a lit pool, and a two car garage. Zoned for Cherry Creek schools and a short drive to the shopping district.",
    rooms: ["dining", "living", "kitchen", "bedroom"],
    features: ["Pool", "Two car garage", "Home office", "Chef's kitchen", "Washer and dryer", "Smart thermostat"],
    highlights: [
      { title: "Room for everyone", body: "Four bedrooms and a dedicated home office." },
      { title: "Top schools", body: "In the Cherry Creek school district." },
      { title: "Outdoor living", body: "A lit pool and a covered patio." },
    ],
    offer: "Sign by January 31 and the first two weeks are free.",
    availableFrom: "2027-02-15",
    deposit: 4350,
    petPolicy: "No pets",
  },
  "capitol-hill": {
    description:
      "A furnished two bedroom flat with a chef's kitchen and big windows over a tree lined street. Utilities included, laundry in the unit, and Cal Anderson Park around the corner.",
    rooms: ["kitchen", "lounge", "bedroom", "dining"],
    features: ["Chef's kitchen", "In unit laundry", "Utilities included", "Bay windows", "Dishwasher", "Linens and towels"],
    highlights: [
      { title: "Cook properly", body: "A six burner range and a full set of pans." },
      { title: "Park nearby", body: "Cal Anderson Park is a two minute walk." },
      { title: "Bring a guest", body: "A second bedroom for visitors or an office." },
    ],
    availableFrom: "2026-12-01",
    deposit: 600,
    petPolicy: "Cats welcome",
  },
  "durham-bungalow": {
    description:
      "A two bedroom bungalow with a screened porch in Trinity Park. A short bike ride to Duke's East Campus and Ninth Street.",
    rooms: ["living", "bedroom", "kitchen", "reading"],
    features: ["Screened porch", "Washer and dryer", "Off street parking", "Gas range", "Ceiling fans", "Storage"],
    highlights: [
      { title: "Near campus", body: "Bike to Duke's East Campus in five minutes." },
      { title: "Pet friendly", body: "Dogs and cats welcome." },
      { title: "Porch season", body: "A screened porch for long evenings." },
    ],
    availableFrom: "2027-01-10",
    deposit: 1965,
    petPolicy: "Dogs and cats welcome, $30 a month pet rent",
  },
  lakeview: {
    description:
      "A furnished one bedroom three blocks from the lakefront trail. Laundry in the unit, a dedicated workspace, and the Belmont L stop five minutes away.",
    rooms: ["lounge", "bedroom", "kitchen", "reading"],
    features: ["In unit laundry", "Workspace", "Keyless entry", "Dishwasher", "Bike storage", "Linens and towels"],
    highlights: [
      { title: "Lake access", body: "The lakefront trail is three blocks east." },
      { title: "Work from home", body: "A desk, an ergonomic chair, and fast wifi." },
      { title: "Commute ready", body: "The Belmont L stop is a five minute walk." },
    ],
    offer: "Stay 4 months or more and your last week is free.",
    availableFrom: "2026-11-25",
    deposit: 500,
    petPolicy: "No pets",
  },
  "barton-creek": {
    description:
      "A three bedroom family home near Barton Creek Greenbelt with a big backyard and a two car garage. Zoned for Zilker Elementary.",
    rooms: ["living", "dining", "kitchen", "bedroom"],
    features: ["Big backyard", "Two car garage", "Washer and dryer", "Central air", "Gas range", "Fenced yard"],
    highlights: [
      { title: "Trails nearby", body: "The Barton Creek Greenbelt is a few minutes away." },
      { title: "School zone", body: "Zoned for Zilker Elementary." },
      { title: "Pet friendly", body: "A fenced yard for dogs." },
    ],
    availableFrom: "2027-03-01",
    deposit: 3675,
    petPolicy: "Dogs and cats welcome, $45 a month pet rent",
  },
  "east-austin-flat": {
    description:
      "A one bedroom flat a block off East Cesar Chavez, with a washer and dryer in the unit and a bus to downtown at the corner. Unfurnished, so you can make it yours. Six and twelve month leases.",
    rooms: ["reading", "kitchen", "bedroom", "living"],
    features: ["Washer and dryer", "Dishwasher", "Central air", "Ceiling fans", "Street parking", "Bike storage"],
    highlights: [
      { title: "Short lease option", body: "Sign for six months if you are still deciding on Austin." },
      { title: "Downtown in 10", body: "The 2 bus runs to downtown every ten minutes." },
      { title: "Bring your dog", body: "Dogs and cats welcome with a small monthly fee." },
    ],
    availableFrom: "2026-12-01",
    deposit: 1895,
    petPolicy: "Dogs and cats welcome, $35 a month pet rent",
  },
  "domain-suite": {
    description:
      "A furnished one bedroom built for people starting a new job in North Austin. Utilities, gigabit wifi, and a reserved parking spot are included. A short walk to the Domain offices, shops, and the Red Line.",
    rooms: ["lounge", "bedroom", "kitchen", "dining"],
    features: ["Utilities included", "Gigabit wifi", "Reserved parking", "Building gym", "Keyless entry", "Linens and towels"],
    highlights: [
      { title: "One bill", body: "Rent covers power, water, wifi, and parking." },
      { title: "Walk to work", body: "Most Domain offices are under ten minutes on foot." },
      { title: "Stay or switch", body: "Extend month to month, or move to a lease nearby with the same profile." },
    ],
    availableFrom: "2026-11-15",
    deposit: 500,
    petPolicy: "No pets",
  },
  "fremont-lease": {
    description:
      "An unfurnished one bedroom on a quiet Fremont street, a short walk to the canal trail and the 40 and 62 buses. In unit laundry and a shared garden.",
    rooms: ["living", "kitchen", "bedroom", "reading"],
    features: ["Washer and dryer", "Dishwasher", "Shared garden", "Bike storage", "Hardwood floors", "Storage"],
    highlights: [
      { title: "Six month option", body: "A shorter first lease while you settle in." },
      { title: "Canal trail", body: "Bike to South Lake Union in about fifteen minutes." },
      { title: "Pet friendly", body: "Dogs and cats welcome." },
    ],
    availableFrom: "2027-01-01",
    deposit: 2295,
    petPolicy: "Dogs and cats welcome, $40 a month pet rent",
  },
};

export function sampleHome(id: string): HomeDetail | null {
  const base = listings.find((l) => l.id === id);
  const more = extra[id];
  if (!base || !more) return null;
  const { rooms, ...rest } = more;
  const photoId = (src: string) => src.match(/photo-[\w-]+/)?.[0];
  const cover = photoId(base.img);
  // Keep the chosen rooms, drop any that repeat the cover, and top up so the gallery always has four.
  const picks = [...rooms, ...(Object.keys(ROOMS) as (keyof typeof ROOMS)[])]
    .filter((r, i, all) => all.indexOf(r) === i && photoId(ROOMS[r].src) !== cover)
    .slice(0, 4)
    .map((r) => ROOMS[r]);
  // Pet rent written in the policy becomes a real monthly fee line.
  const pet = rest.petPolicy.match(/\$(\d+) a month pet rent/);
  const fees: Fee[] = pet ? [{ name: "Pet fee", amount: Number(pet[1]), frequency: "monthly" }] : [];
  return {
    ...base,
    ...rest,
    fees,
    depositRefundable: true,
    leaseTerms: base.type === "yearly" ? (base.leaseTerms ?? [12]) : [],
    photos: [{ src: base.img.replace("w=900", "w=1400"), alt: base.alt }, ...picks],
  };
}

export const offers: Record<string, string> = Object.fromEntries(
  Object.entries(extra)
    .filter(([, v]) => v.offer)
    .map(([k, v]) => [k, v.offer as string]),
);

export const STATE_NAMES: Record<string, string> = {
  CO: "Colorado",
  IL: "Illinois",
  NC: "North Carolina",
  OR: "Oregon",
  TN: "Tennessee",
  TX: "Texas",
  WA: "Washington",
};

/* ---------------- Filter metadata (client safe) ---------------- */

export type PropertyKind = "apartment" | "house" | "townhouse" | "unique";
export type PetKind = "dogs" | "cats" | "both" | "none";

const KIND: Record<string, PropertyKind> = {
  "pearl-loft": "apartment",
  "raleigh-yard": "house",
  "slu-suite": "apartment",
  "denver-craftsman": "house",
  "chicago-studio": "apartment",
  "nashville-townhouse": "townhouse",
  "austin-garden": "apartment",
  "cherry-creek": "house",
  "capitol-hill": "apartment",
  "durham-bungalow": "house",
  lakeview: "apartment",
  "barton-creek": "house",
  "east-austin-flat": "apartment",
  "domain-suite": "apartment",
  "fremont-lease": "apartment",
};

export type ListingMeta = {
  kind: PropertyKind | null;
  availableFrom: string;
  availableUntil: string;
  pets: PetKind;
  amenities: string[];
  text: string;
};

/** Everything the explore filters need for one listing. Owner listings pass their own fields. */
export function metaFor(l: Listing & { propertyType?: string; description?: string }): ListingMeta {
  const more = extra[l.id];
  const features = more?.features ?? [];
  const text = [l.title, more?.description ?? l.description ?? "", ...features].join(" ");
  const policy = more?.petPolicy ?? (l.tags.includes("pets") ? "Dogs and cats welcome" : "");
  const dogs = /dog/i.test(policy) || (!more && l.tags.includes("pets"));
  const cats = /cat/i.test(policy);
  return {
    kind: KIND[l.id] ?? ((l.propertyType as PropertyKind | undefined) ?? null),
    availableFrom: more?.availableFrom ?? l.availableFrom ?? "",
    availableUntil: l.availableUntil ?? "",
    pets: !more && l.pets ? l.pets : dogs && cats ? "both" : dogs ? "dogs" : cats ? "cats" : "none",
    amenities: amenitiesOf(l, features),
    text,
  };
}
