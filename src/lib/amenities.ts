/**
 * The one amenity catalog. The listing flow, the explore filters, and the home
 * page all read from here, so an amenity is named the same way everywhere.
 */

export type AmenityKey =
  | "wifi"
  | "ac"
  | "heating"
  | "laundry"
  | "dishwasher"
  | "kitchen"
  | "furnished"
  | "utilities"
  | "linens"
  | "parking"
  | "garage"
  | "ev"
  | "bike"
  | "transit"
  | "patio"
  | "yard"
  | "pool"
  | "grill"
  | "views"
  | "gym"
  | "elevator"
  | "lobby"
  | "package"
  | "storage"
  | "keyless"
  | "accessible"
  | "workspace"
  | "schools"
  | "fireplace"
  | "thermostat"
  | "basement";

export const AMENITY_GROUPS: { title: string; items: { key: AmenityKey; label: string }[] }[] = [
  {
    title: "Essentials",
    items: [
      { key: "wifi", label: "High speed wifi" },
      { key: "ac", label: "Air conditioning" },
      { key: "heating", label: "Heating" },
      { key: "laundry", label: "Washer and dryer" },
      { key: "dishwasher", label: "Dishwasher" },
      { key: "kitchen", label: "Full kitchen" },
      { key: "furnished", label: "Furnished" },
      { key: "utilities", label: "Utilities included" },
      { key: "linens", label: "Linens and towels" },
    ],
  },
  {
    title: "Parking and getting around",
    items: [
      { key: "parking", label: "Parking" },
      { key: "garage", label: "Garage" },
      { key: "ev", label: "EV charger" },
      { key: "bike", label: "Bike storage" },
      { key: "transit", label: "Near transit" },
    ],
  },
  {
    title: "Outdoor",
    items: [
      { key: "patio", label: "Patio or balcony" },
      { key: "yard", label: "Private yard" },
      { key: "pool", label: "Pool" },
      { key: "grill", label: "Grill" },
      { key: "views", label: "City or water views" },
    ],
  },
  {
    title: "Building",
    items: [
      { key: "gym", label: "Fitness center" },
      { key: "elevator", label: "Elevator" },
      { key: "lobby", label: "Staffed lobby" },
      { key: "package", label: "Package room" },
      { key: "storage", label: "Storage" },
      { key: "keyless", label: "Keyless entry" },
      { key: "accessible", label: "Wheelchair accessible" },
    ],
  },
  {
    title: "Home and family",
    items: [
      { key: "workspace", label: "Dedicated workspace" },
      { key: "schools", label: "Near schools" },
      { key: "fireplace", label: "Fireplace" },
      { key: "thermostat", label: "Smart thermostat" },
      { key: "basement", label: "Basement" },
    ],
  },
];

export const AMENITY_LIST = AMENITY_GROUPS.flatMap((g) => g.items);
export const AMENITY_KEYS = AMENITY_LIST.map((a) => a.key);
export const amenityLabel = (k: string) => AMENITY_LIST.find((a) => a.key === k)?.label ?? k;

/** How the sample inventory's free text features map onto the catalog. */
const MATCH: Record<AmenityKey, (text: string, tags: string[]) => boolean> = {
  wifi: (t) => /wifi|internet/i.test(t),
  ac: (t) => /central air|air condition/i.test(t),
  heating: (t) => /heating|radiant/i.test(t),
  laundry: (t, g) => g.includes("laundry") || /washer|laundry/i.test(t),
  dishwasher: (t) => /dishwasher/i.test(t),
  kitchen: (t) => /kitchen|range/i.test(t),
  furnished: (_t, g) => g.includes("furnished"),
  utilities: (t, g) => g.includes("utilities") || /utilities included/i.test(t),
  linens: (t) => /linen|towel/i.test(t),
  parking: (t, g) => g.includes("parking") || /parking|garage/i.test(t),
  garage: (t) => /garage/i.test(t),
  ev: (t) => /ev charg|electric vehicle/i.test(t),
  bike: (t) => /bike/i.test(t),
  transit: (_t, g) => g.includes("transit"),
  patio: (t) => /patio|porch|deck|balcony/i.test(t),
  yard: (t) => /yard|garden/i.test(t),
  pool: (t) => /pool/i.test(t),
  grill: (t) => /grill|bbq/i.test(t),
  views: (t) => /view/i.test(t),
  gym: (t) => /gym|fitness/i.test(t),
  elevator: (t) => /elevator/i.test(t),
  lobby: (t) => /lobby|doorman|concierge/i.test(t),
  package: (t) => /package/i.test(t),
  storage: (t) => /storage|shed|closet/i.test(t),
  keyless: (t) => /keyless|smart lock/i.test(t),
  accessible: (t) => /wheelchair|step free|accessible/i.test(t),
  workspace: (t, g) => g.includes("workspace") || /desk|office|workspace/i.test(t),
  schools: (_t, g) => g.includes("schools"),
  fireplace: (t) => /fireplace/i.test(t),
  thermostat: (t) => /thermostat/i.test(t),
  basement: (t) => /basement/i.test(t),
};

/** Catalog keys for a home: explicit choices for owner listings, matched text for the samples. */
export function amenitiesOf(l: { tags: string[]; amenities?: string[] }, features: string[] = []): AmenityKey[] {
  if (l.amenities?.length) return l.amenities.filter((k): k is AmenityKey => (AMENITY_KEYS as string[]).includes(k));
  const text = features.join(" | ");
  return AMENITY_KEYS.filter((k) => MATCH[k](text, l.tags));
}

/** Listed features the catalog does not already cover, shown as extras on the home page. */
export function extraFeatures(features: string[]) {
  return features.filter((f) => !AMENITY_KEYS.some((k) => MATCH[k](f, [])));
}
