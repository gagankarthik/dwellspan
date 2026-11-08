"use client";

import { useEffect, useRef, useState } from "react";

/**
 * B11 tagline reveal: words go from muted (30% opacity) to full, one at a
 * time in reading order, tied to scroll progress. Scroll work is throttled
 * through requestAnimationFrame. Reduced motion shows the final state.
 */
export function TaglineReveal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = lines.map((l) => l.split(" "));
  const total = words.reduce((n, line) => n + line.length, 0);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block's top hits 80% of the viewport, 1 when its bottom reaches 50%.
      const progress = (vh * 0.8 - r.top) / (r.height + vh * 0.3);
      const count = reduced ? total : Math.round(Math.min(Math.max(progress, 0), 1) * total);
      setLit((prev) => Math.max(prev, count));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    if (reduced) return () => cancelAnimationFrame(frame);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [total]);

  let index = 0;
  return (
    <p ref={ref} className="mx-auto max-w-[680px] text-center heading-1">
      {words.map((line, li) => (
        <span key={li} className="block">
          {line.map((word, wi) => {
            const i = index++;
            return (
              <span
                key={wi}
                className={`transition-opacity duration-500 ease-base motion-reduce:transition-none ${i < lit ? "opacity-100" : "opacity-30"}`}
              >
                {word}
                {wi < line.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
