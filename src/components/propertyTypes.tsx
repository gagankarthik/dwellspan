import { ApartmentIcon, GuestHouseIcon, HomeIcon, TownhouseIcon } from "./icons";

/** Four plain choices. Each one covers the variations owners might otherwise hesitate over. */
export type PropertyType = "apartment" | "house" | "townhouse" | "unique";

export type TypeOption = { value: PropertyType; label: string; note: string; Icon: typeof HomeIcon };

export const PROPERTY_TYPE_OPTIONS: TypeOption[] = [
  { value: "apartment", label: "Apartment or condo", note: "A unit in a larger building, including lofts", Icon: ApartmentIcon },
  { value: "house", label: "House", note: "A standalone home, from cottages to villas", Icon: HomeIcon },
  { value: "townhouse", label: "Townhouse or duplex", note: "Shares a wall, with its own front door", Icon: TownhouseIcon },
  { value: "unique", label: "Room or small space", note: "A private room, guest house, or tiny home", Icon: GuestHouseIcon },
];

export const propertyTypeLabel = (v: string) => PROPERTY_TYPE_OPTIONS.find((t) => t.value === v)?.label ?? v;
