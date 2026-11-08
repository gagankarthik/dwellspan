"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { START_LISTING_EVENT } from "./StartListingButton";
import { LISTING_TYPE_EVENT, openListProperty } from "../PropertyTypeDialog";
import { PROPERTY_TYPE_OPTIONS, propertyTypeLabel, type PropertyType } from "../propertyTypes";
import { WarningIcon } from "@phosphor-icons/react";
import { AMENITY_GROUPS, amenityLabel } from "@/lib/amenities";
import { FEE_TYPES, LEASE_TERMS, PET_LABEL, SMOKING_LABEL, UTILITIES, heroImages, listings as sample, type Listing, type StayType } from "@/lib/listings";
import { STATE_CODES, US_STATES } from "@/lib/usStates";
import { AmenityKeyIcon } from "../amenityIcon";
import {
  CheckIcon,
  MinusIcon,
  PlusIcon,
  UploadIcon,
} from "../icons";
import { ListingCard } from "../ListingCard";
import { DatePicker } from "../DatePicker";
import { Select } from "../Select";
import { useSession } from "../session";

/* ------------------------------------------------------------------ */

type Draft = {
  propertyType: PropertyType | "";
  type: StayType | "";
  minMonths: string;
  leaseTerms: number[];
  availableFrom: string;
  availableUntil: string;
  address: string;
  unit: string;
  area: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: string;
  amenities: string[];
  petPolicy: "none" | "cats" | "dogs" | "both";
  occupants: number;
  smoking: "no" | "outside" | "yes";
  utilities: string[];
  phone: string;
  contactPref: "email" | "phone" | "text";
  manager: "owner" | "manager";
  company: string;
  title: string;
  description: string;
  price: string;
  deposit: string;
  depositRefundable: boolean;
  fees: { name: string; amount: string; frequency: "once" | "monthly" }[];
};
type Field = keyof Draft | "photo";
type Errors = Partial<Record<Field, string>>;

const EMPTY: Draft = {
  propertyType: "",
  type: "",
  minMonths: "1",
  leaseTerms: [12],
  availableFrom: "",
  availableUntil: "",
  address: "",
  unit: "",
  area: "",
  city: "",
  state: "",
  zip: "",
  beds: 1,
  baths: 1,
  sqft: "",
  amenities: [],
  petPolicy: "none",
  occupants: 2,
  smoking: "no",
  utilities: [],
  phone: "",
  contactPref: "email",
  manager: "owner",
  company: "",
  title: "",
  description: "",
  price: "",
  deposit: "",
  depositRefundable: true,
  fees: [],
};
const DRAFT_KEY = "dwellspan:listing-draft";
const MAX_PHOTO = 8 * 1024 * 1024;

const STEPS: { title: string; intro: string; fields: Field[] }[] = [
  { title: "What kind of place are you listing?", intro: "Pick the option that best describes the home.", fields: ["propertyType"] },
  {
    title: "How do you want to rent it?",
    intro: "Furnished stays fill the months between tenants. A lease locks in steady rent for 6 months or longer.",
    fields: ["type", "minMonths", "leaseTerms", "availableFrom", "availableUntil"],
  },
  {
    title: "Where is it?",
    intro: "Renters see the neighborhood and city. The street address, unit, and ZIP code stay private until they book or sign.",
    fields: ["address", "city", "state", "zip", "area"],
  },
  { title: "Share the basics", intro: "Renters filter by these first, so make them exact.", fields: ["beds", "baths", "sqft"] },
  { title: "What does the home offer?", intro: "Tick everything that applies. Renters filter by these, so the more you add, the more searches you show up in.", fields: ["amenities"] },
  {
    title: "Details and house rules",
    intro: "Set expectations up front so the right renters apply.",
    fields: ["occupants", "smoking", "petPolicy", "utilities"],
  },
  {
    title: "Add photos",
    intro: "Add up to 8 photos. The first one is your cover, so lead with a bright, wide shot of the main room. JPG, PNG, or WebP up to 8 MB each.",
    fields: ["photo"],
  },
  {
    title: "Give it a title and a story",
    intro: "Lead with what makes it special: the light, the street, the commute.",
    fields: ["title", "description"],
  },
  { title: "Set your rent and fees", intro: "Renters see the rent, the deposit, and every fee before they book or sign.", fields: ["price", "deposit", "fees"] },
  {
    title: "How should renters reach you?",
    intro: "Your phone number stays private. We share it only with renters you accept.",
    fields: ["phone", "contactPref", "company"],
  },
  { title: "Review and publish", intro: "This is how your home will appear in search.", fields: [] },
];

const STEP_LABELS = ["Property type", "Stay options", "Location", "Basics", "Amenities", "House rules", "Photos", "Title and story", "Rent and fees", "Contact", "Review"];

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/* ------------------------------------------------------------------ */

function ErrorText({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-2 caption-2 text-error">
      <WarningIcon aria-hidden className="size-4 shrink-0" /> {msg}
    </p>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">) {
  return (
    <div>
      <label htmlFor={id} className="title-4 text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={`focus-ring mt-2 w-full rounded-lg border bg-paper px-4 py-2 body-3 text-ink placeholder:text-ink-3 transition-colors duration-300 ease-base ${
          error ? "border-error" : "border-line hover:border-ink-3"
        }`}
        {...rest}
      />
      {error ? (
        <ErrorText id={`${id}-err`} msg={error} />
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 caption-2 text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (n: number) => String(n),
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (n: number) => string;
}) {
  const btn =
    "focus-ring grid size-10 place-items-center rounded-full border border-line text-ink transition-colors duration-300 ease-base hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]";
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4">
      <span className="body-2 text-ink">{label}</span>
      <div className="flex items-center gap-4">
        <button type="button" className={btn} aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
          <MinusIcon className="size-4" />
        </button>
        <span className="w-16 text-center body-1 text-ink" aria-live="polite">
          {format(value)}
        </span>
        <button type="button" className={btn} aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ListingFlow({ children }: { children?: ReactNode }) {
  const { user, loading } = useSession();
  const [stage, setStage] = useState<"intro" | "flow" | "done">("intro");
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [published, setPublished] = useState<Listing | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const restored = useRef(false);

  // Any "List your property" button further down the page starts the flow here.
  useEffect(() => {
    const start = () => openListProperty();
    const picked = (e: Event) => {
      const type = (e as CustomEvent<PropertyType>).detail;
      setD((prev) => ({ ...prev, propertyType: type }));
      setStage("flow");
      setStep(1);
      setReached((r) => Math.max(r, 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener(START_LISTING_EVENT, start);
    window.addEventListener(LISTING_TYPE_EVENT, picked);
    return () => {
      window.removeEventListener(START_LISTING_EVENT, start);
      window.removeEventListener(LISTING_TYPE_EVENT, picked);
    };
  }, []);

  // /list-your-property?start=1 skips the intro for signed in owners.
  useEffect(() => {
    if (!user) return;
    const id = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("start") !== "1") return;
      setStage("flow");
      // A type picked in the dialog is already in the draft, so begin at the next step.
      try {
        const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as Partial<Draft>;
        if (saved.propertyType) {
          setStep(1);
          setReached(1);
        }
      } catch {
        /* no draft */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [user]);

  // Restore a saved draft once, then keep saving as the owner types.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) setD({ ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) });
      } catch {
        /* ignore a broken draft */
      }
      restored.current = true;
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (restored.current) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  }, [d]);


  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // A real benchmark from the inventory: median rent for similar homes in the same city.
  const benchmark = useMemo(() => {
    const cityName = d.city.split(",")[0].trim().toLowerCase();
    const pool = sample.filter((l) => l.city.toLowerCase().startsWith(cityName) && (!d.type || l.type === d.type));
    if (!cityName || pool.length === 0) return null;
    const prices = pool.map((l) => l.price).sort((a, b) => a - b);
    return { median: prices[Math.floor(prices.length / 2)], count: pool.length, city: pool[0].city };
  }, [d.city, d.type]);

  function validate(fields: Field[]): Errors {
    const e: Errors = {};
    for (const f of fields) {
      if (f === "propertyType" && !d.propertyType) e.propertyType = "Choose a property type to continue.";
      if (f === "type" && !d.type) e.type = "Choose furnished stays or a lease.";
      if (f === "address" && d.address.trim().length < 5) e.address = "Enter the street address.";
      if (f === "area" && !d.area.trim()) e.area = "Enter the neighborhood.";
      if (f === "city" && !/^[A-Za-z .'’-]{2,40}$/.test(d.city.trim())) e.city = "Enter the city.";
      if (f === "state" && !STATE_CODES.includes(d.state)) e.state = "Choose a state.";
      if (f === "zip" && !/^\d{5}$/.test(d.zip)) e.zip = "Enter a 5 digit ZIP code.";
      if (f === "leaseTerms" && d.type === "yearly" && d.leaseTerms.length === 0) e.leaseTerms = "Choose at least one lease length.";
      if (f === "availableFrom" && !d.availableFrom) e.availableFrom = "Pick the first date it is available.";
      if (f === "availableUntil") {
        if (!d.availableUntil) e.availableUntil = "Pick the last date it is available.";
        else if (d.availableFrom && d.availableUntil <= d.availableFrom) e.availableUntil = "The end date must be after the start date.";
        else if (d.type === "monthly" && d.availableFrom) {
          const end = new Date(`${d.availableFrom}T00:00:00`);
          end.setMonth(end.getMonth() + Number(d.minMonths));
          const pad = (n: number) => String(n).padStart(2, "0");
          const endISO = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
          if (d.availableUntil < endISO)
            e.availableUntil = `Leave at least ${d.minMonths} ${d.minMonths === "1" ? "month" : "months"}, your minimum stay.`;
        }
      }
      if (f === "deposit" && d.deposit && !(Number(d.deposit) <= 50000)) e.deposit = "Enter a deposit up to $50,000.";
      if (f === "fees" && d.fees.some((x) => !x.name || !(Number(x.amount) >= 1 && Number(x.amount) <= 10000)))
        e.fees = "Each fee needs a type and an amount between $1 and $10,000.";
      if (f === "sqft") {
        const n = Number(d.sqft);
        if (!(n >= 150 && n <= 20000)) e.sqft = "Enter a size between 150 and 20,000 sqft.";
      }
      if (f === "photo" && photos.length === 0) e.photo = "Add at least one photo to continue.";
      if (f === "phone" && d.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "").length !== 10) e.phone = "Enter a 10 digit US phone number.";
      if (f === "company" && d.manager === "manager" && d.company.trim().length < 2) e.company = "Enter the management company name.";
      if (f === "title" && (d.title.trim().length < 8 || d.title.trim().length > 60)) e.title = "Use 8 to 60 characters.";
      if (f === "description" && (d.description.trim().length < 40 || d.description.trim().length > 600))
        e.description = "Use 40 to 600 characters.";
      if (f === "price") {
        const n = Number(d.price);
        if (!(n >= 300 && n <= 50000)) e.price = "Enter a monthly rent between $300 and $50,000.";
      }
    }
    return e;
  }

  function next() {
    const e = validate(STEPS[step].fields);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setReached((r) => Math.max(r, step + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addPhotos(list: FileList | null | undefined) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    const room = 8 - photos.length;
    const next: { file: File; url: string }[] = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setErrors((e) => ({ ...e, photo: `${file.name} is not a JPG, PNG, or WebP photo.` }));
        continue;
      }
      if (file.size > MAX_PHOTO) {
        setErrors((e) => ({ ...e, photo: `${file.name} is over 8 MB. Try a smaller one.` }));
        continue;
      }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    if (files.length > room) setErrors((e) => ({ ...e, photo: "You can add up to 8 photos." }));
    else if (next.length === files.length) setErrors((e) => ({ ...e, photo: undefined }));
    setPhotos((cur) => [...cur, ...next]);
  }

  function removePhoto(i: number) {
    setPhotos((cur) => {
      URL.revokeObjectURL(cur[i].url);
      return cur.filter((_, j) => j !== i);
    });
  }

  function makeCover(i: number) {
    setPhotos((cur) => [cur[i], ...cur.filter((_, j) => j !== i)]);
  }

  async function publish() {
    const all = validate(STEPS.flatMap((s) => s.fields));
    if (Object.keys(all).length) {
      setErrors(all);
      setStep(STEPS.findIndex((s) => s.fields.some((f) => all[f])));
      return;
    }
    setBusy(true);
    setFormError("");
    const fd = new FormData();
    (["propertyType", "type", "minMonths", "availableFrom", "availableUntil", "address", "unit", "area", "city", "state", "zip", "sqft", "title", "description", "price", "deposit"] as const).forEach(
      (k) => fd.set(k, String(d[k]).trim()),
    );
    fd.set("beds", String(d.beds));
    fd.set("baths", String(d.baths));
    fd.set("petPolicy", d.petPolicy);
    fd.set("occupants", String(d.occupants));
    fd.set("smoking", d.smoking);
    d.utilities.forEach((u) => fd.append("utilities", u));
    fd.set("phone", d.phone);
    fd.set("contactPref", d.contactPref);
    fd.set("manager", d.manager);
    fd.set("company", d.company);
    fd.set("depositRefundable", d.depositRefundable ? "yes" : "no");
    fd.set("fees", JSON.stringify(d.fees.map((x) => ({ ...x, amount: Number(x.amount) }))));
    d.leaseTerms.forEach((t) => fd.append("leaseTerms", String(t)));
    d.amenities.forEach((a) => fd.append("amenities", a));
    photos.forEach((ph) => fd.append("photos", ph.file));
    try {
      const res = await fetch("/api/listings", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { listing?: Listing; errors?: Errors; error?: string };
      if (!res.ok || !data.listing) {
        if (data.errors && Object.keys(data.errors).length) {
          setErrors(data.errors);
          const first = STEPS.findIndex((s) => s.fields.some((f) => data.errors?.[f]));
          if (first >= 0) setStep(first);
        } else setFormError(data.error ?? "We could not publish your listing. Try again in a minute.");
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      setPublished(data.listing);
      setStage("done");
      window.scrollTo({ top: 0 });
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- Intro ---------------- */
  if (stage === "intro") {
    const cta = loading ? (
      <span className="inline-block h-12 w-48 animate-pulse rounded-lg bg-line" aria-label="Checking your account" />
    ) : user ? (
      <button type="button" onClick={() => (d.propertyType ? setStage("flow") : openListProperty())} className="btn-primary button-md h-12 px-6!">
        {d.propertyType ? "Continue your draft" : "Get started"}
      </button>
    ) : (
      <button type="button" onClick={() => openListProperty()} className="btn-primary button-md h-12 px-6!">
        Log in or sign up to start
      </button>
    );

    const steps = [
      { t: "Tell us about your place", b: "Property type, stay length, location, and the basics renters filter by.", img: sample[0].img },
      { t: "Make it stand out", b: "Add a bright cover photo, a title, and a short story about the home.", img: sample[8].img },
      { t: "Set your rent and publish", b: "Choose a monthly price and go live in search the moment you publish.", img: sample[4].img },
    ];

    return (
      <div className="flex flex-col gap-16">
        <section aria-labelledby="list-title" className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 id="list-title" className="heading-1 text-ink">
              Turn your empty months
              <br className="hidden sm:block" /> into rent
            </h1>
            <p className="mt-4 max-w-[60ch] lead text-ink-2">
              List it furnished between tenants or lease it for the year. Publishing takes about ten minutes.
            </p>
            <RentEstimator />
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {cta}
              {!user && !loading && <p className="caption-2 text-ink-3">An account keeps renters and owners verified.</p>}
            </div>
          </div>
          <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl bg-line shadow-xl lg:block">
            <Image src={heroImages.top.src} alt={heroImages.top.alt} fill priority sizes="50vw" className="object-cover" />
          </div>
        </section>

        <section id="how" aria-labelledby="how-title" className="scroll-mt-24">
          <h2 id="how-title" className="heading-2 text-ink">
            List in three steps
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((st, i) => (
              <li key={st.t}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-line shadow-md">
                  <Image src={st.img} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
                  <span className="absolute top-4 left-4 grid size-10 place-items-center rounded-full bg-paper subhead text-ink shadow-md">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 subhead text-ink">{st.t}</h3>
                <p className="mt-2 max-w-[45ch] body-6 text-ink-2">{st.b}</p>
              </li>
            ))}
          </ol>
        </section>

        {children}
      </div>
    );
  }

  /* ---------------- Done ---------------- */
  if (stage === "done" && published) {
    return (
      <div className="mx-auto max-w-[560px] text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
          <CheckIcon className="size-8" strokeWidth={2.25} />
        </span>
        <h1 className="mt-6 heading-1 text-ink">Your home is live</h1>
        <p className="mt-4 body-3 text-ink-2">
          {published.title} now appears in search for {published.city}. We will email you when renters ask about it.
        </p>
        <div className="mx-auto mt-8 max-w-[320px] text-left">
          <ListingCard listing={published} />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href={`/homes/${published.id}`} className="btn-primary button-md">
            View your listing
          </Link>
          <Link href="/dashboard" className="btn-secondary button-md">
            Go to your dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ---------------- Flow ---------------- */
  const S = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const previewListing: Listing = {
    id: "preview",
    title: d.title || "Your listing title",
    area: d.area || "Neighborhood",
    city: `${d.city || "City"}, ${d.state || "ST"}`,
    type: (d.type || "monthly") as StayType,
    price: Number(d.price) || 0,
    minMonths: d.type === "yearly" ? Math.min(...(d.leaseTerms.length ? d.leaseTerms : [12])) : Number(d.minMonths),
    leaseTerms: d.leaseTerms,
    beds: d.beds,
    baths: d.baths,
    sqft: Number(d.sqft) || 0,
    rating: 0,
    reviews: 0,
    tags: [],
    img: photos[0]?.url ?? "",
    alt: `Cover photo of ${d.title || "your listing"}`,
  };

  return (
    <div className="grid gap-8 pb-24 lg:grid-cols-[280px_1fr] lg:gap-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between gap-4 lg:block">
          <p className="caption-2 text-ink-3">
            Step {step + 1} of {STEPS.length}
          </p>
          <Link
            href="/dashboard"
            className="focus-ring rounded-lg px-4 py-2 button-sm text-ink transition-colors duration-300 ease-base hover:bg-paper lg:hidden"
          >
            Save and exit
          </Link>
        </div>
        <ol className="mt-4 hidden flex-col gap-1 lg:flex">
          {STEP_LABELS.map((label, i) => {
            const done = i < step || (i <= reached && i !== step);
            const current = i === step;
            const can = i <= reached;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!can}
                  aria-current={current ? "step" : undefined}
                  onClick={() => can && setStep(i)}
                  className={`focus-ring flex w-full items-center gap-4 rounded-xl px-4 py-2 text-left transition-colors duration-300 ease-base ${
                    current ? "bg-paper shadow-md" : can ? "hover:bg-paper" : "cursor-default"
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full caption-3 ${
                      current ? "bg-brand text-paper" : done ? "bg-ink text-paper" : "bg-line text-ink-3"
                    }`}
                  >
                    {done && !current ? <CheckIcon className="size-4" strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span className={current ? "body-4 text-ink" : can ? "body-5 text-ink-2" : "body-6 text-ink-3"}>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <Link
          href="/dashboard"
          className="focus-ring mt-6 hidden rounded-lg px-4 py-2 button-sm text-ink underline underline-offset-4 hover:text-brand lg:inline-flex"
        >
          Save and exit
        </Link>
      </aside>

      <section aria-labelledby="step-title" className="min-w-0">
        <h1 id="step-title" className="heading-1 text-ink">
          {S.title}
        </h1>
        <p className="mt-4 max-w-[60ch] lead text-ink-2">{S.intro}</p>

        <div key={step} className="mt-8 max-w-[760px] animate-swap rounded-3xl bg-paper p-6 shadow-lg sm:p-8">
          {/* 1. Property type */}
          {step === 0 && (
            <fieldset>
              <legend className="sr-only">Property type</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {PROPERTY_TYPE_OPTIONS.map(({ value, label, note, Icon }) => {
                  const on = d.propertyType === value;
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-colors duration-300 ease-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                        on ? "border-ink bg-sand ring-1 ring-ink" : "border-line hover:border-ink"
                      }`}
                    >
                      <input type="radio" name="propertyType" className="sr-only" checked={on} onChange={() => set("propertyType", value)} />
                      <Icon className="size-10 shrink-0 text-ink" />
                      <span>
                        <span className="block title-3 text-ink">{label}</span>
                        <span className="block caption-2 text-ink-3">{note}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <ErrorText id="pt-err" msg={errors.propertyType} />
            </fieldset>
          )}

          {/* 2. Stay type */}
          {step === 1 && (
            <fieldset>
              <legend className="sr-only">Stay type</legend>
              <div className="flex flex-col gap-4">
                {(
                  [
                    ["monthly", "Furnished stays", "Rent it furnished for 1 to 11 months at a time. Great for relocations, work assignments, and the gap between tenants."],
                    ["yearly", "Long term lease", "Sign a 12 month lease in the app and collect rent by ACH autopay."],
                  ] as const
                ).map(([value, label, note]) => {
                  const on = d.type === value;
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-6 transition-colors duration-300 ease-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                        on ? "border-ink bg-sand ring-1 ring-ink" : "border-line hover:border-ink"
                      }`}
                    >
                      <input type="radio" name="stayType" className="sr-only" checked={on} onChange={() => set("type", value)} />
                      <span>
                        <span className="block subhead text-ink">{label}</span>
                        <span className="mt-2 block max-w-[60ch] body-6 text-ink-2">{note}</span>
                      </span>
                      <span className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full border-2 ${on ? "border-ink bg-ink text-paper" : "border-line"}`}>
                        {on && <CheckIcon className="size-4" strokeWidth={2.5} />}
                      </span>
                    </label>
                  );
                })}
              </div>
              <ErrorText id="type-err" msg={errors.type} />
              {d.type === "monthly" && (
                <div className="mt-6 max-w-[280px]">
                  <span id="min-label" className="title-4 text-ink">
                    Minimum stay
                  </span>
                  <Select
                    className="mt-2"
                    labelId="min-label"
                    value={d.minMonths}
                    onChange={(v) => set("minMonths", v)}
                    options={Array.from({ length: 11 }, (_, i) => ({
                      value: String(i + 1),
                      label: `${i + 1} ${i ? "months" : "month"}`,
                    }))}
                  />
                </div>
              )}
              {d.type === "yearly" && (
                <div className="mt-6">
                  <p className="title-4 text-ink">Lease lengths you offer</p>
                  <p className="caption-2 text-ink-3">Pick one or more. Renters choose from these when they apply.</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Lease lengths">
                    {LEASE_TERMS.map((m) => {
                      const on = d.leaseTerms.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={on}
                          onClick={() => set("leaseTerms", on ? d.leaseTerms.filter((x) => x !== m) : [...d.leaseTerms, m].sort((a, b) => a - b))}
                          className={`focus-ring h-10 rounded-full border px-4 button-sm transition-colors duration-300 ease-base active:scale-[0.98] ${
                            on ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                          }`}
                        >
                          {m} months
                        </button>
                      );
                    })}
                  </div>
                  <ErrorText id="terms-err" msg={errors.leaseTerms} />
                </div>
              )}
              {d.type && (
                <div className="mt-6 border-t border-line pt-6">
                  <p className="title-4 text-ink">{d.type === "yearly" ? "When can the lease start?" : "When is it available?"}</p>
                  <p className="caption-2 text-ink-3">
                    {d.type === "yearly"
                      ? "Renters can pick a lease start date anywhere in this window."
                      : "Renters can only book stays that start and end inside these dates."}
                  </p>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2">
                    <div>
                      <span id="f-from-label" className="caption-3 text-ink">
                        Available from
                      </span>
                      <div className="mt-2">
                        <DatePicker
                          id="f-from"
                          labelId="f-from-label"
                          value={d.availableFrom}
                          onChange={(v) => {
                            set("availableFrom", v);
                            if (d.availableUntil && v && d.availableUntil <= v) set("availableUntil", "");
                          }}
                          invalid={Boolean(errors.availableFrom)}
                          placeholder="Start date"
                        />
                      </div>
                      <ErrorText id="from-err" msg={errors.availableFrom} />
                    </div>
                    <div>
                      <span id="f-until-label" className="caption-3 text-ink">
                        Available until
                      </span>
                      <div className="mt-2">
                        <DatePicker
                          id="f-until"
                          labelId="f-until-label"
                          min={d.availableFrom || undefined}
                          value={d.availableUntil}
                          onChange={(v) => set("availableUntil", v)}
                          invalid={Boolean(errors.availableUntil)}
                          placeholder="End date"
                          align="right"
                        />
                      </div>
                      <ErrorText id="until-err" msg={errors.availableUntil} />
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          )}

          {/* 3. Location */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-[3fr_1fr]">
                <TextField
                  id="f-address"
                  label="Street address"
                  value={d.address}
                  onChange={(v) => set("address", v)}
                  error={errors.address}
                  autoComplete="address-line1"
                  placeholder="742 Pine Street"
                />
                <TextField id="f-unit" label="Unit (optional)" value={d.unit} onChange={(v) => set("unit", v)} autoComplete="address-line2" placeholder="4B" />
              </div>
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                <TextField id="f-city" label="City" value={d.city} onChange={(v) => set("city", v)} error={errors.city} autoComplete="address-level2" placeholder="Seattle" />
                <div>
                  <span id="f-state-label" className="title-4 text-ink">
                    State
                  </span>
                  <Select
                    className="mt-2"
                    labelId="f-state-label"
                    value={d.state}
                    onChange={(v) => set("state", v)}
                    invalid={Boolean(errors.state)}
                    options={[{ value: "", label: "Select" }, ...US_STATES.map(([code, name]) => ({ value: code, label: `${name}`, note: code }))]}
                  />
                  <ErrorText id="state-err" msg={errors.state} />
                </div>
                <TextField
                  id="f-zip"
                  label="ZIP code"
                  value={d.zip}
                  onChange={(v) => set("zip", v.replace(/[^\d]/g, "").slice(0, 5))}
                  error={errors.zip}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="98101"
                />
              </div>
              <TextField id="f-area" label="Neighborhood" value={d.area} onChange={(v) => set("area", v)} error={errors.area} placeholder="Belltown" hint="Shown to renters in search, for example Capitol Hill or Five Points." />
              <p className="caption-2 text-ink-3">Your street address, unit, and ZIP code are private until a renter books or signs.</p>
            </div>
          )}

          {/* 4. Basics */}
          {step === 3 && (
            <div>
              <Stepper label="Bedrooms" value={d.beds} onChange={(n) => set("beds", n)} min={0} max={10} format={(n) => (n === 0 ? "Studio" : String(n))} />
              <Stepper label="Bathrooms" value={d.baths} onChange={(n) => set("baths", n)} min={1} max={8} step={0.5} />
              <div className="mt-6 max-w-[280px]">
                <TextField
                  id="f-sqft"
                  label="Size in square feet"
                  value={d.sqft}
                  onChange={(v) => set("sqft", v.replace(/[^\d]/g, ""))}
                  error={errors.sqft}
                  inputMode="numeric"
                  placeholder="850"
                />
              </div>
            </div>
          )}

          {/* 5. Amenities */}
          {step === 4 && (
            <fieldset className="flex flex-col gap-6">
              <legend className="sr-only">Amenities</legend>
              {AMENITY_GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="caption-3 text-ink-3">{g.title}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {g.items.map((a) => {
                      const on = d.amenities.includes(a.key);
                      return (
                        <label
                          key={a.key}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 body-6 transition-colors duration-300 ease-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                            on ? "border-ink bg-sand text-ink ring-1 ring-ink" : "border-line text-ink-2 hover:border-ink hover:text-ink"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            onChange={() => set("amenities", on ? d.amenities.filter((x) => x !== a.key) : [...d.amenities, a.key])}
                          />
                          <AmenityKeyIcon k={a.key} className="size-5 shrink-0 text-ink" />
                          {a.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </fieldset>
          )}

          {/* 6. House rules */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <Stepper label="Maximum occupants" value={d.occupants} onChange={(n) => set("occupants", n)} min={1} max={16} />
              <div>
                <p className="title-4 text-ink">Smoking</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Smoking">
                  {(
                    [
                      ["no", "No smoking"],
                      ["outside", "Outside only"],
                      ["yes", "Allowed"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={d.smoking === v}
                      onClick={() => set("smoking", v)}
                      className={`focus-ring h-10 rounded-full border px-4 button-sm transition-colors duration-300 ease-base ${
                        d.smoking === v ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="title-4 text-ink">Pets</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Pets">
                  {(
                    [
                      ["none", "No pets"],
                      ["cats", "Cats only"],
                      ["dogs", "Dogs only"],
                      ["both", "Cats and dogs"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={d.petPolicy === v}
                      onClick={() => set("petPolicy", v)}
                      className={`focus-ring h-10 rounded-full border px-4 button-sm transition-colors duration-300 ease-base ${
                        d.petPolicy === v ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 caption-2 text-ink-3">Charge pet rent or a pet deposit on the rent step.</p>
              </div>
              <div>
                <p className="title-4 text-ink">Utilities included in the rent</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {UTILITIES.map(([k, label]) => {
                    const on = d.utilities.includes(k);
                    return (
                      <label
                        key={k}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 body-6 transition-colors duration-300 ease-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                          on ? "border-ink bg-sand text-ink ring-1 ring-ink" : "border-line text-ink-2 hover:border-ink"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[#1f1f1f]"
                          checked={on}
                          onChange={() => set("utilities", on ? d.utilities.filter((x) => x !== k) : [...d.utilities, k])}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 7. Photos */}
          {step === 6 && (
            <div>
              <input
                ref={fileInput}
                id="f-photo"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
                aria-describedby={errors.photo ? "photo-err" : undefined}
              />
              {photos.length > 0 && (
                <ul className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photos.map((ph, i) => (
                    <li key={ph.url} className={`group relative overflow-hidden rounded-xl bg-line ${i === 0 ? "col-span-2 row-span-2 sm:col-span-2" : ""}`}>
                      <div className="relative aspect-[4/3]">
                        <Image src={ph.url} alt={`Photo ${i + 1}`} fill unoptimized className="object-cover" />
                      </div>
                      {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-paper px-2 py-1 caption-3 text-ink shadow-sm">Cover</span>}
                      <div className="absolute right-2 bottom-2 flex gap-2">
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => makeCover(i)}
                            className="focus-ring rounded-lg bg-paper px-2 py-1 caption-3 text-ink shadow-sm hover:bg-sand"
                          >
                            Make cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`Remove photo ${i + 1}`}
                          className="focus-ring rounded-lg bg-paper px-2 py-1 caption-3 text-error shadow-sm hover:bg-sand"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {photos.length < 8 && (
                <label
                  htmlFor="f-photo"
                  onDragOver={(e: DragEvent) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e: DragEvent) => {
                    e.preventDefault();
                    setDragging(false);
                    addPhotos(e.dataTransfer.files);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-300 ease-base ${
                    photos.length ? "py-8" : "aspect-[4/3]"
                  } ${dragging ? "border-brand bg-brand-soft" : errors.photo ? "border-error" : "border-line hover:border-ink-3"}`}
                >
                  <UploadIcon className="size-12 text-ink" />
                  <span className="subhead text-ink">{photos.length ? "Add more photos" : "Drag your photos here"}</span>
                  <span className="body-6 text-ink-2">{8 - photos.length} of 8 left</span>
                  <span className="btn-secondary button-sm">Browse files</span>
                </label>
              )}
              <ErrorText id="photo-err" msg={errors.photo} />
            </div>
          )}

          {/* 8. Title and description */}
          {step === 7 && (
            <div className="flex flex-col gap-6">
              <TextField
                id="f-title"
                label="Title"
                value={d.title}
                onChange={(v) => set("title", v.slice(0, 60))}
                error={errors.title}
                placeholder="Sunny one bedroom near the park"
                hint={`${d.title.length} of 60 characters`}
              />
              <div>
                <label htmlFor="f-desc" className="title-4 text-ink">
                  Description
                </label>
                <textarea
                  id="f-desc"
                  rows={6}
                  value={d.description}
                  onChange={(e) => set("description", e.target.value.slice(0, 600))}
                  aria-invalid={errors.description ? true : undefined}
                  aria-describedby={errors.description ? "desc-err" : "desc-hint"}
                  placeholder="Morning light in every room, a ten minute walk to the light rail, and a quiet street lined with maples."
                  className={`focus-ring mt-2 w-full rounded-lg border bg-paper px-4 py-2 body-3 text-ink placeholder:text-ink-3 transition-colors duration-300 ease-base ${
                    errors.description ? "border-error" : "border-line hover:border-ink-3"
                  }`}
                />
                {errors.description ? (
                  <ErrorText id="desc-err" msg={errors.description} />
                ) : (
                  <p id="desc-hint" className="mt-2 caption-2 text-ink-3">
                    {d.description.length} of 600 characters
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 9. Price */}
          {step === 8 && (
            <div>
              <label htmlFor="f-price" className="sr-only">
                Monthly rent in dollars
              </label>
              <div
                className={`flex items-baseline justify-center gap-2 rounded-2xl border px-6 py-8 transition-colors duration-300 ease-base focus-within:border-ink ${
                  errors.price ? "border-error" : "border-line"
                }`}
              >
                <span className="heading-1 text-ink">$</span>
                <input
                  id="f-price"
                  inputMode="numeric"
                  value={d.price ? Number(d.price).toLocaleString("en-US") : ""}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
                  placeholder="2,450"
                  aria-invalid={errors.price ? true : undefined}
                  aria-describedby={errors.price ? "price-err" : "price-hint"}
                  className="w-48 bg-transparent text-center heading-1 text-ink placeholder:text-ink-3 focus:outline-none"
                />
                <span className="lead text-ink-2">per month</span>
              </div>
              <ErrorText id="price-err" msg={errors.price} />
              <p id="price-hint" className="mt-4 body-6 text-ink-2">
                {benchmark
                  ? `Similar ${d.type === "yearly" ? "leases" : "furnished stays"} in ${benchmark.city} rent for about ${money(benchmark.median)} a month.`
                  : "Set the monthly rent first, then any deposit and fees below."}
              </p>

              <div className="mt-8 border-t border-line pt-6">
                <p className="title-3 text-ink">Security deposit</p>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="f-deposit"
                    label="Amount"
                    value={d.deposit ? Number(d.deposit).toLocaleString("en-US") : ""}
                    onChange={(v) => set("deposit", v.replace(/[^\d]/g, "").slice(0, 5))}
                    error={errors.deposit}
                    inputMode="numeric"
                    placeholder="Leave empty for no deposit"
                  />
                  <div>
                    <span className="title-4 text-ink">Refundable?</span>
                    <div className="mt-2 flex h-12 rounded-lg border border-line p-1" role="group" aria-label="Deposit refundable">
                      {(
                        [
                          [true, "Refundable"],
                          [false, "Non-refundable"],
                        ] as const
                      ).map(([v, label]) => (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={d.depositRefundable === v}
                          onClick={() => set("depositRefundable", v)}
                          className={`focus-ring flex-1 rounded px-4 button-sm transition-colors duration-300 ease-base ${
                            d.depositRefundable === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <p className="title-3 text-ink">Other fees</p>
                <p className="caption-2 text-ink-3">Pet, parking, cleaning, application, or anything else renters pay besides rent.</p>
                {d.fees.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {d.fees.map((fee, i) => {
                      const update = (patch: Partial<typeof fee>) => set("fees", d.fees.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                      return (
                        <li key={i} className="grid items-center gap-2 rounded-xl bg-sand p-2 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                          <span id={`fee-type-${i}`} className="sr-only">
                            Fee type
                          </span>
                          <Select
                            labelId={`fee-type-${i}`}
                            size="sm"
                            value={fee.name}
                            onChange={(v) => update({ name: v })}
                            options={[{ value: "", label: "Fee type" }, ...FEE_TYPES.map((t) => ({ value: t, label: t }))]}
                          />
                          <label className="flex h-10 items-center gap-1 rounded-lg border border-line bg-paper px-4 body-6 text-ink focus-within:border-ink">
                            <span className="sr-only">Amount</span>$
                            <input
                              inputMode="numeric"
                              value={fee.amount}
                              placeholder="0"
                              onChange={(e) => update({ amount: e.target.value.replace(/[^\d]/g, "").slice(0, 5) })}
                              className="w-full bg-transparent focus:outline-none"
                            />
                          </label>
                          <span id={`fee-freq-${i}`} className="sr-only">
                            How often
                          </span>
                          <Select
                            labelId={`fee-freq-${i}`}
                            size="sm"
                            value={fee.frequency}
                            onChange={(v) => update({ frequency: v as "once" | "monthly" })}
                            options={[
                              { value: "monthly", label: "Every month" },
                              { value: "once", label: "One time" },
                            ]}
                          />
                          <button
                            type="button"
                            onClick={() => set("fees", d.fees.filter((_, j) => j !== i))}
                            aria-label={`Remove fee ${i + 1}`}
                            className="focus-ring grid size-10 place-items-center rounded-lg text-ink-2 transition-colors duration-300 ease-base hover:bg-paper hover:text-error"
                          >
                            <MinusIcon className="size-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <ErrorText id="fees-err" msg={errors.fees} />
                <button
                  type="button"
                  onClick={() => set("fees", [...d.fees, { name: "", amount: "", frequency: "monthly" }])}
                  className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-ink-3 px-4 button-sm text-ink transition-colors duration-300 ease-base hover:border-ink hover:bg-sand"
                >
                  <PlusIcon className="size-4" /> Add a fee
                </button>
              </div>
            </div>
          )}

          {/* 10. Contact */}
          {step === 9 && (
            <div className="flex flex-col gap-6">
              <TextField
                id="f-phone"
                label="Phone number"
                value={d.phone}
                onChange={(v) => set("phone", v.replace(/[^\d+()\s-]/g, "").slice(0, 18))}
                error={errors.phone}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(206) 555 0123"
                hint="Private. Shared only with renters you accept."
              />
              <div>
                <p className="title-4 text-ink">Best way to reach you</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Preferred contact">
                  {(
                    [
                      ["email", "Email"],
                      ["phone", "Phone call"],
                      ["text", "Text message"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={d.contactPref === v}
                      onClick={() => set("contactPref", v)}
                      className={`focus-ring h-10 rounded-full border px-4 button-sm transition-colors duration-300 ease-base ${
                        d.contactPref === v ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="title-4 text-ink">Who manages this home?</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["owner", "I own it and manage it myself"],
                      ["manager", "I manage it for the owner"],
                    ] as const
                  ).map(([v, label]) => (
                    <label
                      key={v}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-4 body-5 transition-colors duration-300 ease-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                        d.manager === v ? "border-ink bg-sand text-ink ring-1 ring-ink" : "border-line text-ink-2 hover:border-ink"
                      }`}
                    >
                      <input type="radio" name="manager" className="accent-[#1f1f1f]" checked={d.manager === v} onChange={() => set("manager", v)} />
                      {label}
                    </label>
                  ))}
                </div>
                {d.manager === "manager" && (
                  <div className="mt-4">
                    <TextField
                      id="f-company"
                      label="Management company"
                      value={d.company}
                      onChange={(v) => set("company", v.slice(0, 60))}
                      error={errors.company}
                      autoComplete="organization"
                      placeholder="Alder Property Group"
                      hint="Shown to renters as Managed by this company."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 11. Review */}
          {step === 10 && (
            <div className="grid gap-8 sm:grid-cols-[280px_1fr]">
              <ListingCard listing={previewListing} preview />
              <dl className="flex flex-col">
                {(
                  [
                    ["Property", d.propertyType ? propertyTypeLabel(d.propertyType) : "", 0],
                    ["Stay", d.type === "yearly" ? `Lease of ${d.leaseTerms.join(", ")} months` : `Furnished, ${d.minMonths} month minimum`, 1],
                    [
                      "Available",
                      d.availableFrom && d.availableUntil
                        ? `${new Date(`${d.availableFrom}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} to ${new Date(`${d.availableUntil}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : "",
                      1,
                    ],
                    ["Address", `${d.address}${d.unit ? `, ${d.unit}` : ""}, ${d.city}, ${d.state} ${d.zip}`, 2],
                    ["Amenities", d.amenities.length ? d.amenities.map(amenityLabel).join(", ") : "None selected", 4],
                    [
                      "House rules",
                      `Up to ${d.occupants} people · ${SMOKING_LABEL[d.smoking]} · ${PET_LABEL[d.petPolicy]}${d.utilities.length ? ` · Includes ${UTILITIES.filter(([k]) => d.utilities.includes(k)).map(([, l]) => l.toLowerCase()).join(", ")}` : ""}`,
                      5,
                    ],
                    ["Photos", `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`, 6],
                    ["Rent", d.price ? `${money(Number(d.price))} per month` : "", 8],
                    ["Deposit", d.deposit ? `${money(Number(d.deposit))}, ${d.depositRefundable ? "refundable" : "non-refundable"}` : "No deposit", 8],
                    ["Fees", d.fees.length ? d.fees.map((x) => `${x.name} ${money(Number(x.amount))}${x.frequency === "monthly" ? "/mo" : " once"}`).join(", ") : "None", 8],
                    ["Contact", `${d.phone} · prefers ${d.contactPref === "text" ? "text" : d.contactPref}${d.manager === "manager" ? ` · ${d.company}` : ""}`, 9],
                  ] as [string, string, number][]
                ).map(([k, v, target]) => (
                  <div key={k} className="flex items-start justify-between gap-4 border-b border-line py-4 first:pt-0">
                    <div>
                      <dt className="caption-2 text-ink-3">{k}</dt>
                      <dd className="mt-1 body-5 text-ink">{v}</dd>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(target)}
                      className="focus-ring rounded body-4 text-ink underline underline-offset-4 hover:text-brand"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </dl>
              {formError && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-error/30 bg-[#fdf1f0] px-4 py-2 body-6 text-error sm:col-span-2">
                  <WarningIcon aria-hidden className="mt-1 size-4 shrink-0" /> {formError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer bar: progress, back, next */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper">
        <div className="h-1 bg-line" aria-hidden>
          <div className="h-1 bg-ink transition-transform duration-500 ease-base origin-left" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => (step === 0 ? setStage("intro") : setStep((s) => s - 1))}
            className="focus-ring rounded body-4 text-ink underline underline-offset-4 hover:text-brand"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary button-md min-w-32">
              Next
            </button>
          ) : (
            <button type="button" onClick={publish} disabled={busy} aria-busy={busy} className="btn-primary button-md min-w-32">
              {busy ? "Publishing" : "Publish listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const EST_CITIES = Array.from(new Set(sample.map((l) => l.city))).sort();

/** Estimates monthly rent from similar homes in the inventory, and says how many it used. */
function RentEstimator() {
  const [city, setCity] = useState(EST_CITIES[0]);
  const [type, setType] = useState<StayType>("monthly");
  const [beds, setBeds] = useState(1);

  const est = useMemo(() => {
    const cityPool = sample.filter((l) => l.city === city && l.type === type);
    const bedPool = cityPool.filter((l) => l.beds === beds);
    const pool = bedPool.length ? bedPool : cityPool.length ? cityPool : sample.filter((l) => l.type === type);
    const prices = pool.map((l) => l.price).sort((a, b) => a - b);
    return { price: prices[Math.floor(prices.length / 2)], count: pool.length, local: cityPool.length > 0 };
  }, [city, type, beds]);

  return (
    <div className="mt-8 rounded-3xl bg-sand p-6">
      <p className="title-3 text-ink">See what your home could earn</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <span id="est-city" className="caption-3 text-ink">
            City
          </span>
          <Select className="mt-2" labelId="est-city" value={city} onChange={setCity} options={EST_CITIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div>
          <span id="est-beds" className="caption-3 text-ink">
            Bedrooms
          </span>
          <Select
            className="mt-2"
            labelId="est-beds"
            value={String(beds)}
            onChange={(v) => setBeds(Number(v))}
            options={[0, 1, 2, 3, 4].map((n) => ({ value: String(n), label: n === 0 ? "Studio" : `${n} bedroom${n > 1 ? "s" : ""}` }))}
          />
        </div>
      </div>
      <div role="group" aria-label="Stay type" className="mt-4 flex rounded-lg bg-paper p-1">
        {(
          [
            ["monthly", "Furnished stays"],
            ["yearly", "Long term lease"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={type === v}
            onClick={() => setType(v)}
            className={`focus-ring flex-1 rounded px-4 py-2 button-sm transition-colors duration-300 ease-base ${
              type === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-6 text-ink" aria-live="polite">
        <span className="heading-2">{money(est.price)}</span>
        <span className="body-3 text-ink-2"> a month</span>
      </p>
      <p className="mt-2 caption-2 text-ink-3">
        Typical rent for {est.count} similar {est.count === 1 ? "home" : "homes"}
        {est.local ? ` in ${city}` : " across Dwellspan"} on Dwellspan today.
      </p>
    </div>
  );
}
