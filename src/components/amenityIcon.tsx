import type { AmenityKey } from "@/lib/amenities";
import {
  AccessibleIcon,
  ApartmentIcon,
  BikeIcon,
  BoxIcon,
  CheckIcon,
  DishwasherIcon,
  DumbbellIcon,
  ElevatorIcon,
  EvChargerIcon,
  FlameIcon,
  FurnishedIcon,
  GrillIcon,
  HeatingIcon,
  KeyIcon,
  LaundryIcon,
  ParkingIcon,
  PawIcon,
  PoolIcon,
  PotIcon,
  SchoolIcon,
  SnowflakeIcon,
  StairsIcon,
  SunIcon,
  ThermostatIcon,
  TowelIcon,
  TransitIcon,
  TreeIcon,
  UtilitiesIcon,
  WifiIcon,
  WindowIcon,
  WorkspaceIcon,
} from "./icons";

/** One icon per catalog amenity, used everywhere an amenity appears. */
export const AMENITY_ICONS: Record<AmenityKey, typeof CheckIcon> = {
  wifi: WifiIcon,
  ac: SnowflakeIcon,
  heating: HeatingIcon,
  laundry: LaundryIcon,
  dishwasher: DishwasherIcon,
  kitchen: PotIcon,
  furnished: FurnishedIcon,
  utilities: UtilitiesIcon,
  linens: TowelIcon,
  parking: ParkingIcon,
  garage: ParkingIcon,
  ev: EvChargerIcon,
  bike: BikeIcon,
  transit: TransitIcon,
  patio: SunIcon,
  yard: TreeIcon,
  pool: PoolIcon,
  grill: GrillIcon,
  views: WindowIcon,
  gym: DumbbellIcon,
  elevator: ElevatorIcon,
  lobby: ApartmentIcon,
  package: BoxIcon,
  storage: BoxIcon,
  keyless: KeyIcon,
  accessible: AccessibleIcon,
  workspace: WorkspaceIcon,
  schools: SchoolIcon,
  fireplace: FlameIcon,
  thermostat: ThermostatIcon,
  basement: StairsIcon,
};

export function AmenityKeyIcon({ k, className = "size-6" }: { k: AmenityKey; className?: string }) {
  const Icon = AMENITY_ICONS[k] ?? CheckIcon;
  return <Icon className={className} />;
}

/** For free text extras that are not in the catalog (porch, fenced yard, and so on). */
const RULES: [RegExp, typeof CheckIcon][] = [
  [/pet|dog|cat/i, PawIcon],
  [/porch|patio|deck/i, SunIcon],
  [/yard|garden|fence/i, TreeIcon],
  [/gas|fireplace/i, FlameIcon],
  [/range|kitchen|chef/i, PotIcon],
  [/storage|shed|closet/i, BoxIcon],
  [/window|light/i, WindowIcon],
  [/clean/i, TowelIcon],
];

export function AmenityIcon({ label, className = "size-6" }: { label: string; className?: string }) {
  const Icon = RULES.find(([re]) => re.test(label))?.[1] ?? CheckIcon;
  return <Icon className={className} />;
}
