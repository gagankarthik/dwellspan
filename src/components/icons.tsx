/**
 * Dwellspan icon set, drawn in the same language as the logo:
 * 24 unit grid, one 1.75 stroke, round caps and joins, rounded corners,
 * and the arched doorway wherever a building appears.
 */
import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { filled?: boolean };

function Icon({ children, className = "size-5", filled, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const FurnishedIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 11V9a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v2" />
    <path d="M3 13a1.5 1.5 0 0 1 3 0v2h12v-2a1.5 1.5 0 0 1 3 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    <path d="M6 18v2M18 18v2" />
  </Icon>
);

export const SchoolIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10 12 4l9 6" />
    <path d="M5 9v11h14V9" />
    <path d="M10 20v-3a2 2 0 0 1 4 0v3" />
    <circle cx="12" cy="11" r="1.5" />
  </Icon>
);

export const PawIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.5 16c0-2.2 1.6-4 3.5-4s3.5 1.8 3.5 4c0 1.6-1.5 2.5-3.5 2.5S8.5 17.6 8.5 16Z" />
    <circle cx="6.25" cy="11" r="1.5" />
    <circle cx="9.5" cy="7" r="1.5" />
    <circle cx="14.5" cy="7" r="1.5" />
    <circle cx="17.75" cy="11" r="1.5" />
  </Icon>
);

export const WorkspaceIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 15h17" />
    <path d="M7 15V8.5A1.5 1.5 0 0 1 8.5 7h7A1.5 1.5 0 0 1 17 8.5V15" />
    <path d="M5.5 15v5M18.5 15v5" />
  </Icon>
);

export const ParkingIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="5" />
    <path d="M10 16.5v-9h2.75a2.75 2.75 0 0 1 0 5.5H10" />
  </Icon>
);

export const LaundryIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="3" width="14" height="18" rx="3.5" />
    <circle cx="12" cy="13.5" r="4" />
    <path d="M8.5 6.75h1.5" />
  </Icon>
);

export const UtilitiesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.5 3 6 13.5h5.5L10.5 21 18 10.5h-5.5Z" />
  </Icon>
);

export const TransitIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="3" width="12" height="14" rx="3.5" />
    <path d="M6 10.5h12" />
    <path d="M9.5 14h.01M14.5 14h.01" strokeWidth={2.5} />
    <path d="m8.5 21 1.5-4M15.5 21 14 17" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.75-4.75" />
  </Icon>
);

export const HeartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10.25A4.25 4.25 0 0 1 12 7a4.25 4.25 0 0 1 7.5 2.75C19.5 15.4 12 20 12 20Z" />
  </Icon>
);

export const StarIcon = (p: IconProps) => (
  <Icon {...p} filled>
    <path d="m12 3.75 2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.55 7 19.2l.95-5.6L3.9 9.65l5.6-.8Z" />
  </Icon>
);

export const ArrowIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const ChevronIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m7 9.5 5 5 5-5" />
  </Icon>
);

/** Empty state: the logo's house with its open door. */
export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 20.5V11l7-5.75L19 11v9.5h-4.25v-4a2.75 2.75 0 0 0-5.5 0v4Z" />
  </Icon>
);

export const ApartmentIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2.5" />
    <path d="M9 7.5h1.5M13.5 7.5H15M9 11.5h1.5M13.5 11.5H15" />
    <path d="M10 21v-3a2 2 0 0 1 4 0v3" />
  </Icon>
);

export const TownhouseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 20.5V11L7.5 6.5l5 4.5" />
    <path d="M11.5 20.5V10l5-4.5 5 4.5v10.5Z" />
    <path d="M2.5 20.5h19M6 20.5v-2.5a1.5 1.5 0 0 1 3 0v2.5M15 20.5v-2.5a1.5 1.5 0 0 1 3 0v2.5" />
  </Icon>
);

export const CondoIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20.5V8.5L12 3.5l8 5v12" />
    <path d="M3 20.5h18M8.5 11h1.5M14 11h1.5M8.5 15h1.5M14 15h1.5" />
  </Icon>
);

export const StudioIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M6.5 14.5v-2a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v2M5.5 14.5h8M16 8v8" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4.5 14.5v3a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 12h12" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 6v12M6 12h12" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
  </Icon>
);

/* ---------------- Amenity icons ---------------- */

export const FlameIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-1.5 2-2 3.5-2 5-1-1-1.75-2.25-2-4C8 9.25 6 11.75 6 15a6 6 0 0 0 6 6Z" />
  </Icon>
);
export const SnowflakeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
    <path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" />
  </Icon>
);
export const WifiIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.75a7.75 7.75 0 0 1 11 0M9.5 16a3.5 3.5 0 0 1 5 0" />
    <path d="M12 19.25h.01" strokeWidth={2.5} />
  </Icon>
);
export const DumbbellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
  </Icon>
);
export const PoolIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 15V5.5a2 2 0 0 1 4 0M14 15V5.5a2 2 0 0 1 4 0M8 9h6M8 12.5h6" />
    <path d="M3 18.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
  </Icon>
);
export const TreeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21v-6M12 15a5 5 0 0 0 4.5-7.2A4.5 4.5 0 0 0 12 3a4.5 4.5 0 0 0-4.5 4.8A5 5 0 0 0 12 15Z" />
  </Icon>
);
export const FenceIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 20V7l1.5-2L8 7v13M11 20V7l1.5-2L14 7v13M17 20V7l1.5-2L20 7v13" />
    <path d="M3.5 10.5h18M3.5 16h18" />
  </Icon>
);
export const StairsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 20.5h4v-4h4v-4h4v-4h5" />
  </Icon>
);
export const KeyIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" />
  </Icon>
);
export const BikeIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="16" r="3.5" />
    <circle cx="18" cy="16" r="3.5" />
    <path d="M6 16 9.5 8.5h5L18 16M9.5 8.5 12 16h2.5M13.5 6h2" />
  </Icon>
);
export const BoxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 8 12 4l8.5 4v8L12 20l-8.5-4Z" />
    <path d="M3.5 8 12 12l8.5-4M12 12v8" />
  </Icon>
);
export const WindowIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
    <path d="M12 3.5v17M4.5 12h15" />
  </Icon>
);
export const FanIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="1.5" />
    <path d="M12 10.5c0-3 .5-6.5 3-6.5s2 3.5-1.5 6.5M13.5 12c3 0 6.5.5 6.5 3s-3.5 2-6.5-1.5M12 13.5c0 3-.5 6.5-3 6.5s-2-3.5 1.5-6.5M10.5 12c-3 0-6.5-.5-6.5-3s3.5-2 6.5 1.5" />
  </Icon>
);
export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 13.75 9 19 10.75 13.75 12.5 12 18l-1.75-5.5L5 10.75 10.25 9Z" />
    <path d="M18.5 16.5v3M17 18h3" />
  </Icon>
);
export const PotIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 10.5h15v5a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4Z" />
    <path d="M2.5 10.5h2M19.5 10.5h2M9 7c0-1 1-1.5 1-2.5M13 7c0-1 1-1.5 1-2.5" />
  </Icon>
);
export const TowelIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 4.5h10a2.5 2.5 0 0 1 2.5 2.5v13H8.5V7A2.5 2.5 0 0 0 6 4.5a2.5 2.5 0 0 0-2.5 2.5v3h5" />
    <path d="M11.5 16h4" />
  </Icon>
);
export const DishwasherIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
    <path d="M4.5 8h15M8 6h.01M11 6h.01" />
    <path d="M9 13.5c0 1.5 1.5 3 3 3s3-1.5 3-3" />
  </Icon>
);
export const ThermostatIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 12 15 9M12 6.5v1M17.5 12h-1M6.5 12h1" />
  </Icon>
);
export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Icon>
);
export const DoorIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 20.5v-15A2.5 2.5 0 0 1 8.5 3h7A2.5 2.5 0 0 1 18 5.5v15M4 20.5h16" />
    <path d="M14.5 12.5h.01" strokeWidth={2.5} />
  </Icon>
);

/* ---------------- Property type icons ---------------- */

export const LoftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 20.5V8l4-3 4 3 4-3 4 3v12.5Z" />
    <path d="M7 11.5h3v3H7ZM14 11.5h3v3h-3ZM10.5 20.5V18a1.5 1.5 0 0 1 3 0v2.5" />
  </Icon>
);
export const DuplexIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10.5 12 4l9 6.5V20.5H3Z" />
    <path d="M12 9v11.5M6 20.5v-3a1.5 1.5 0 0 1 3 0v3M15 20.5v-3a1.5 1.5 0 0 1 3 0v3" />
  </Icon>
);
export const CabinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 20.5 12 3.5l9.5 17Z" />
    <path d="M9 20.5v-4a3 3 0 0 1 6 0v4M7.5 14h9" />
  </Icon>
);
export const VillaIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 10.5h19L19 6.5H5Z" />
    <path d="M4 10.5v8.5h16v-8.5M7.5 13v6M16.5 13v6M10.5 19v-3a1.5 1.5 0 0 1 3 0v3" />
    <path d="M2.5 21.5h19" />
  </Icon>
);
export const GuestHouseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 20.5V10L8 5.5l5.5 4.5v10.5" />
    <path d="M13.5 20.5v-5l4-3 4 3v5M2.5 20.5h19M6.5 20.5v-3a1.5 1.5 0 0 1 3 0v3" />
  </Icon>
);
export const RoomIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 18.5V8M3 14h18v4.5M21 18.5V14" />
    <path d="M3 11.5h5.5a2 2 0 0 1 2 2V14M10.5 14v-1.5a2 2 0 0 1 2-2H18a3 3 0 0 1 3 3V14" />
  </Icon>
);
export const TinyHomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 16.5V10L11 5l6.5 5v6.5Z" />
    <path d="M17.5 16.5H21M9 16.5v-3h4v3" />
    <circle cx="7.5" cy="18.5" r="1.75" />
    <circle cx="14.5" cy="18.5" r="1.75" />
  </Icon>
);

export const EvChargerIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="3.5" width="10" height="17" rx="2.5" />
    <path d="M10 7.5 8 11.5h3l-2 4M14.5 9.5h2a2 2 0 0 1 2 2v4.5a1.5 1.5 0 0 0 3 0V8l-2-2" />
  </Icon>
);
export const ElevatorIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
    <path d="M12 3.5v17M8 9.5 9.5 8 11 9.5M13 8l1.5 1.5L16 8" />
  </Icon>
);
export const AccessibleIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="4.5" r="1.5" />
    <path d="M11 8v6h5l2 5M11 11h4.5" />
    <path d="M8 10.5a5.5 5.5 0 1 0 6.5 8" />
  </Icon>
);
export const GrillIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.5h16a8 8 0 0 1-16 0Z" />
    <path d="M8 16.5 6 21M16 16.5l2 4.5M12 17.5v3.5M9 6c0-1 1-1.5 1-2.5M14 6c0-1 1-1.5 1-2.5" />
  </Icon>
);
export const HeatingIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="7" width="17" height="11" rx="2.5" />
    <path d="M8 7v11M12 7v11M16 7v11M5.5 18v2.5M18.5 18v2.5" />
  </Icon>
);

/* ---------------- Dashboard icons ---------------- */

export const OverviewIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Icon>
);
export const InboxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 13.5 6 5.5h12l2.5 8V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18Z" />
    <path d="M3.5 13.5H8a2 2 0 0 1 2 2 2 2 0 0 0 4 0 2 2 0 0 1 2-2h4.5" />
  </Icon>
);
export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7" />
    <path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
  </Icon>
);
export const HelpIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.75 9.5a2.25 2.25 0 1 1 3.5 1.9c-.75.5-1.25 1-1.25 1.85M12 16.5h.01" />
  </Icon>
);
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);
export const WrenchIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 4a4.5 4.5 0 0 0-4.2 6.1L4.4 16a2.1 2.1 0 0 0 3 3l5.9-5.9A4.5 4.5 0 0 0 19.6 8l-2.8 2.8-2.6-.4-.4-2.6L16.6 5a4.5 4.5 0 0 0-2.1-1Z" />
  </Icon>
);
export const LedgerIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v15.5l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5V5A1.5 1.5 0 0 1 6 3.5Z" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </Icon>
);
export const TeamIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8.5" r="3.25" />
    <path d="M3 19.5a6 6 0 0 1 12 0" />
    <path d="M15.5 5.5a3.25 3.25 0 0 1 0 6.25M17.5 14a6 6 0 0 1 3.5 5.5" />
  </Icon>
);
export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z" />
    <path d="M10 21h4" />
  </Icon>
);
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </Icon>
);
export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.3 4.5 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4M12 17h.01" />
  </Icon>
);
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Icon>
);
export const DropIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5s6 6.4 6 10.75a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5Z" />
  </Icon>
);
export const BoltIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 2.75 5.5 13.5H12l-1 7.75 7.5-10.75H12Z" />
  </Icon>
);
export const BugIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="7.5" y="7.5" width="9" height="12.5" rx="4.5" />
    <path d="M9.5 7.5a2.5 2.5 0 0 1 5 0M12 11v9M7.5 12H4M20 12h-3.5M7.5 16.5l-3 1.5M16.5 16.5l3 1.5M7.5 8.5 5 6.5M16.5 8.5 19 6.5" />
  </Icon>
);
export const CardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <path d="M2.5 10h19M6.5 14.5h4" />
  </Icon>
);
