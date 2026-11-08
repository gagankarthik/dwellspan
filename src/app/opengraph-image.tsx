import { ImageResponse } from "next/og";

export const alt = "Dwellspan: furnished monthly stays and yearly leases";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: 80,
          color: "#1f1f1f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 600 }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <path d="M7 27V15L16 7.5L25 15V27H19.5V22a3.5 3.5 0 0 0-7 0v5Z" stroke="#2350d9" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ color: "#2350d9", fontSize: 44, letterSpacing: -1.6 }}>dwellspan</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: -2,
            color: "#1f1f1f",
          }}
        >
          <span>Find a home for one month</span>
          <span>or the next twelve</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#6a6a6a" }}>
          Furnished stays and long term leases, searched, signed, and paid in one app.
        </div>
      </div>
    ),
    size,
  );
}
