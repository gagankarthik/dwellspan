import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dwellspan.com";
const description =
  "Search furnished stays and long term leases on one map. Book or sign, pay rent, and request repairs in one app.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dwellspan | Furnished stays and long term leases",
    template: "%s | Dwellspan",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Dwellspan",
    title: "Find a home for one month or the next twelve",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find a home for one month or the next twelve",
    description,
  },
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geist.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] btn-primary button-sm"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
