// Sample inventory for the landing page demo. Replace with live data.

export type StayType = "monthly" | "yearly";
export type Tag = "furnished" | "schools" | "pets" | "workspace" | "parking" | "laundry" | "utilities" | "transit";

export type Listing = {
  id: string;
  title: string;
  area: string;
  city: string;
  type: StayType;
  price: number;
  minMonths: number;
  beds: number;
  baths: number;
  sqft: number;
  rating: number;
  reviews: number;
  tags: Tag[];
  img: string;
  alt: string;
  /** Lease lengths offered, in months. Leases only; sample leases offer 12. */
  leaseTerms?: number[];
  /** Catalog amenity keys chosen by the owner (sample homes derive theirs from features). */
  amenities?: string[];
  fees?: Fee[];
  deposit?: number;
  depositRefundable?: boolean;
  /** Owner set availability window, YYYY-MM-DD */
  availableFrom?: string;
  availableUntil?: string;
  /** Extra photos after the cover */
  gallery?: string[];
  occupants?: number;
  smoking?: SmokingPolicy;
  pets?: PetPolicy;
  utilitiesIncluded?: string[];
  /** "Managed by" name shown to renters when a property manager lists it */
  managedBy?: string;
};

export type SmokingPolicy = "no" | "outside" | "yes";
export type PetPolicy = "none" | "cats" | "dogs" | "both";
export const UTILITIES = [
  ["electricity", "Electricity"],
  ["water", "Water and sewer"],
  ["gas", "Gas"],
  ["heat", "Heat"],
  ["internet", "Internet"],
  ["trash", "Trash and recycling"],
] as const;
export const SMOKING_LABEL: Record<SmokingPolicy, string> = { no: "No smoking", outside: "Smoking outside only", yes: "Smoking allowed" };
export const PET_LABEL: Record<PetPolicy, string> = { none: "No pets", cats: "Cats welcome", dogs: "Dogs welcome", both: "Cats and dogs welcome" };

export type Fee = { name: string; amount: number; frequency: "once" | "monthly" };
export const LEASE_TERMS = [6, 12, 14, 18, 24, 36] as const;
export const FEE_TYPES = ["Pet fee", "Parking fee", "Cleaning fee", "Application fee", "Utilities", "Amenity fee", "Other"] as const;

/** "12 month lease" or "6 to 36 month lease" */
export function leaseLabel(terms: number[] = [12]) {
  const t = [...terms].sort((a, b) => a - b);
  return t.length > 1 && t[0] !== t[t.length - 1] ? `${t[0]} to ${t[t.length - 1]} month lease` : `${t[0] ?? 12} month lease`;
}

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

export const listings: Listing[] = [
  {
    id: "pearl-loft",
    title: "Furnished loft near the Pearl",
    area: "Pearl District",
    city: "Portland, OR",
    type: "monthly",
    price: 3215,
    minMonths: 1,
    beds: 1,
    baths: 1,
    sqft: 742,
    rating: 4.91,
    reviews: 38,
    tags: ["furnished", "workspace", "transit"],
    img: u("1502672260266-1c1ef2d93688"),
    alt: "Bright loft living room with a gray sofa and tall windows",
  },
  {
    id: "raleigh-yard",
    title: "Two bedroom with a fenced yard",
    area: "Five Points",
    city: "Raleigh, NC",
    type: "yearly",
    price: 2640,
    minMonths: 12,
    beds: 2,
    baths: 2,
    sqft: 1104,
    rating: 4.86,
    reviews: 12,
    tags: ["schools", "pets", "parking", "laundry"],
    img: u("1570129477492-45c003edd2be"),
    alt: "White two story house with a front lawn",
  },
  {
    id: "slu-suite",
    title: "Corporate suite by the lake",
    area: "South Lake Union",
    city: "Seattle, WA",
    type: "monthly",
    price: 3890,
    minMonths: 3,
    beds: 1,
    baths: 1,
    sqft: 668,
    rating: 4.94,
    reviews: 51,
    tags: ["furnished", "workspace", "utilities", "transit"],
    img: u("1522708323590-d24dbb6b0267"),
    alt: "Open plan apartment with a dining table and modern kitchen",
  },
  {
    id: "denver-craftsman",
    title: "Craftsman near Steele Elementary",
    area: "Washington Park",
    city: "Denver, CO",
    type: "yearly",
    price: 2985,
    minMonths: 12,
    beds: 3,
    baths: 2,
    sqft: 1486,
    rating: 4.78,
    reviews: 9,
    tags: ["schools", "pets", "parking", "laundry"],
    img: u("1568605114967-8130f3a36994"),
    alt: "Gray craftsman house with a covered porch at dusk",
  },
  {
    id: "chicago-studio",
    title: "Studio with skyline views",
    area: "West Loop",
    city: "Chicago, IL",
    type: "monthly",
    price: 2175,
    minMonths: 1,
    beds: 0,
    baths: 1,
    sqft: 512,
    rating: 4.83,
    reviews: 27,
    tags: ["furnished", "utilities", "transit"],
    img: u("1505691938895-1758d7feb511"),
    alt: "Neatly made bed beside a window in a calm studio",
  },
  {
    id: "nashville-townhouse",
    title: "Townhouse off Gallatin Avenue",
    area: "East Nashville",
    city: "Nashville, TN",
    type: "yearly",
    price: 2410,
    minMonths: 12,
    beds: 2,
    baths: 1.5,
    sqft: 1212,
    rating: 4.89,
    reviews: 17,
    tags: ["pets", "parking", "laundry"],
    img: u("1564013799919-ab600027ffc6"),
    alt: "Modern house exterior with a pool and large glass doors",
  },
  {
    id: "austin-garden",
    title: "Garden apartment with a desk nook",
    area: "Hyde Park",
    city: "Austin, TX",
    type: "monthly",
    price: 2560,
    minMonths: 2,
    beds: 1,
    baths: 1,
    sqft: 701,
    rating: 4.72,
    reviews: 19,
    tags: ["furnished", "pets", "workspace"],
    img: u("1493809842364-78817add7ffb"),
    alt: "Living room with a sofa, plants, and natural light",
  },
  {
    id: "cherry-creek",
    title: "Modern home in the Cherry Creek zone",
    area: "Cherry Creek",
    city: "Denver, CO",
    type: "yearly",
    price: 4350,
    minMonths: 12,
    beds: 4,
    baths: 3,
    sqft: 2310,
    rating: 4.95,
    reviews: 6,
    tags: ["schools", "parking", "laundry", "workspace"],
    img: u("1600596542815-ffad4c1539a9"),
    alt: "Contemporary white home with a pool under a blue sky",
  },
  {
    id: "capitol-hill",
    title: "Flat with a chef’s kitchen",
    area: "Capitol Hill",
    city: "Seattle, WA",
    type: "monthly",
    price: 3340,
    minMonths: 1,
    beds: 2,
    baths: 1,
    sqft: 958,
    rating: 4.88,
    reviews: 33,
    tags: ["furnished", "laundry", "utilities"],
    img: u("1484154218962-a197022b5858"),
    alt: "White kitchen with wood counters and pendant lights",
  },
  {
    id: "durham-bungalow",
    title: "Bungalow a short ride to Duke",
    area: "Trinity Park",
    city: "Durham, NC",
    type: "yearly",
    price: 1965,
    minMonths: 12,
    beds: 2,
    baths: 1,
    sqft: 874,
    rating: 4.81,
    reviews: 14,
    tags: ["pets", "parking", "laundry", "transit"],
    img: u("1449844908441-8829872d2607"),
    alt: "Small house with a porch surrounded by trees",
  },
  {
    id: "lakeview",
    title: "Furnished one bedroom by the lake",
    area: "Lakeview",
    city: "Chicago, IL",
    type: "monthly",
    price: 2790,
    minMonths: 1,
    beds: 1,
    baths: 1,
    sqft: 690,
    rating: 4.93,
    reviews: 22,
    tags: ["furnished", "workspace", "transit", "laundry"],
    img: u("1560448204-e02f11c3d0e2"),
    alt: "Living area with a sofa, rug, and dining corner",
  },
  {
    id: "barton-creek",
    title: "Family home near Barton Creek",
    area: "Zilker",
    city: "Austin, TX",
    type: "yearly",
    price: 3675,
    minMonths: 12,
    beds: 3,
    baths: 2.5,
    sqft: 1890,
    rating: 4.84,
    reviews: 11,
    tags: ["schools", "pets", "parking", "laundry"],
    img: u("1580587771525-78b9dba3b914"),
    alt: "Large modern family home with a manicured lawn",
  },
];

const hd = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2400&q=80`;

export const heroImages = {
  main: {
    src: hd("1613490493576-7fde63acd811"),
    alt: "Modern white villa with wood ceilings, floor to ceiling glass, and a long pool",
  },
  top: { src: hd("1586023492125-27b2c045efd7"), alt: "Furnished living room with a green sofa" },
  bottom: { src: hd("1600596542815-ffad4c1539a9"), alt: "Contemporary white home with a pool under a blue sky" },
};
