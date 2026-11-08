import type { Metadata } from "next";
import { SimplePage } from "@/components/SimplePage";

export const metadata: Metadata = { title: "Privacy policy", robots: { index: false } };

export default function Privacy() {
  return (
    <SimplePage title="Privacy policy">
      <p>Last updated November 6, 2026. This is a working draft and will be reviewed before launch.</p>
      <h2 className="mt-4 subhead text-ink">What we collect</h2>
      <p>
        When you create an account we store your name, your email address, and a salted hash of your password. We never
        store your password itself. When you request owner access we store your email and the number of units you
        own.
      </p>
      <h2 className="mt-4 subhead text-ink">Cookies</h2>
      <p>
        We set one cookie, which keeps you signed in. It is marked HTTP only and expires after seven days or when you
        log out. We do not use advertising or tracking cookies.
      </p>
      <h2 className="mt-4 subhead text-ink">Your choices</h2>
      <p>You can log out at any time from your account page. To delete your account, contact support.</p>
    </SimplePage>
  );
}
