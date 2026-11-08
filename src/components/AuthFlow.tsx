"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { EyeIcon, EyeSlashIcon, WarningIcon } from "@phosphor-icons/react";
import { LogoSymbol } from "./Logo";
import { announceAuthChange } from "./session";

type Step = "email" | "password" | "signup";
type Errors = Partial<Record<"name" | "email" | "password" | "form", string>>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Only allow redirects back to pages on this site. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

const inputCls = (bad: boolean) =>
  `focus-ring h-14 w-full rounded-xl border bg-paper px-4 body-3 text-ink placeholder:text-ink-3 transition-colors duration-300 ease-base ${
    bad ? "border-error" : "border-line hover:border-ink-3"
  }`;

function Msg({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={id} className="mt-2 flex items-center gap-2 caption-2 text-error">
        <WarningIcon aria-hidden className="size-4 shrink-0" /> {error}
      </p>
    );
  if (hint)
    return (
      <p id={id} className="mt-2 caption-2 text-ink-3">
        {hint}
      </p>
    );
  return null;
}

/**
 * Email first sign in: enter an email, then either the password (existing
 * account) or name and password (new account) appears.
 */
export function AuthFlow({
  onDone,
  idPrefix = "auth",
  role = "renter",
  next: nextProp,
}: {
  onDone?: () => void;
  idPrefix?: string;
  /** account type for new sign ups: owners when they start on the owner page, renters everywhere else */
  role?: "renter" | "owner";
  /** where to go after logging in or signing up */
  next?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const id = (k: string) => `${idPrefix}-${k}`;

  async function post(path: string, body: object) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { exists?: boolean; error?: string; errors?: Errors };
    return { ok: res.ok, status: res.status, data };
  }

  function finish() {
    announceAuthChange();
    const next = nextProp ?? nextPath();
    if (onDone) onDone();
    if (next) router.push(next);
    router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (step === "email") {
      if (!email.trim()) errs.email = "Enter your email to continue.";
      else if (!EMAIL.test(email.trim())) errs.email = "Enter a valid email, like you@example.com.";
    }
    if (step === "password" && !password) errs.password = "Enter your password.";
    if (step === "signup") {
      if (!name.trim()) errs.name = "Enter your name.";
      if (password.length < 8) errs.password = "Use at least 8 characters.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      if (step === "email") {
        const r = await post("/api/auth/check", { email });
        if (!r.ok) return setErrors({ email: r.data.error ?? "Enter a valid email." });
        setPassword("");
        setStep(r.data.exists ? "password" : "signup");
      } else if (step === "password") {
        const r = await post("/api/auth/login", { email, password });
        if (!r.ok)
          return setErrors(
            r.status === 401 ? { password: "That password is not right. Try again." } : { form: r.data.error ?? "Something went wrong." },
          );
        finish();
      } else {
        const r = await post("/api/auth/signup", { name, email, password, role });
        if (!r.ok) return setErrors(r.data.errors ?? { form: r.data.error ?? "Something went wrong." });
        finish();
      }
    } catch {
      setErrors({ form: "We could not reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  const changeEmail = (
    <div className="flex h-14 items-center justify-between gap-4 rounded-xl bg-sand px-4">
      <span className="min-w-0 truncate body-5 text-ink">{email}</span>
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setErrors({});
        }}
        className="focus-ring shrink-0 rounded body-4 text-ink underline underline-offset-4 hover:text-brand"
      >
        Change
      </button>
    </div>
  );

  const passwordField = (hint?: string): ReactNode => (
    <div>
      <label htmlFor={id("password")} className="sr-only">
        Password
      </label>
      <div className="relative">
        <input
          id={id("password")}
          type={show ? "text" : "password"}
          autoComplete={step === "signup" ? "new-password" : "current-password"}
          autoFocus={step === "password"}
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={id("password-msg")}
          className={`${inputCls(Boolean(errors.password))} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="focus-ring absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition-colors duration-300 ease-base hover:bg-sand hover:text-ink"
        >
          {show ? <EyeSlashIcon aria-hidden className="size-4" /> : <EyeIcon aria-hidden className="size-4" />}
        </button>
      </div>
      <Msg id={id("password-msg")} error={errors.password} hint={hint} />
    </div>
  );

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div aria-live="polite" className="flex flex-col items-center text-center">
        <LogoSymbol className="size-12 text-brand" />
        <h2 className="mt-4 heading-3 text-ink">
          {step === "email" ? "Log in or sign up" : step === "password" ? "Log in" : "Create your account"}
        </h2>
      </div>

      {errors.form && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-error/30 bg-[#fdf1f0] px-4 py-2 body-6 text-error">
          <WarningIcon aria-hidden className="mt-1 size-4 shrink-0" /> {errors.form}
        </p>
      )}

      <div key={step} className="mt-4 flex animate-swap flex-col gap-4">
        {step === "email" ? (
          <div>
            <label htmlFor={id("email")} className="sr-only">
              Email
            </label>
            <input
              id={id("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={id("email-msg")}
              placeholder="Email"
              className={inputCls(Boolean(errors.email))}
            />
            <Msg id={id("email-msg")} error={errors.email} />
          </div>
        ) : (
          changeEmail
        )}

        {step === "password" && passwordField()}

        {step === "signup" && (
          <>
            <div>
              <label htmlFor={id("name")} className="sr-only">
                Full name
              </label>
              <input
                id={id("name")}
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={id("name-msg")}
                className={inputCls(Boolean(errors.name))}
              />
              <Msg id={id("name-msg")} error={errors.name} />
            </div>
            {passwordField("At least 8 characters.")}
          </>
        )}
      </div>

      <button type="submit" disabled={busy} aria-busy={busy} className="btn-primary button-md h-14 w-full rounded-xl!">
        {busy
          ? step === "email"
            ? "Checking"
            : step === "password"
              ? "Logging in"
              : "Creating your account"
          : step === "email"
            ? "Continue"
            : step === "password"
              ? "Log in"
              : "Agree and create account"}
      </button>

      {step === "signup" && (
        <p className="text-center caption-2 text-ink-3">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="focus-ring rounded underline underline-offset-4 hover:text-ink">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="focus-ring rounded underline underline-offset-4 hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}
