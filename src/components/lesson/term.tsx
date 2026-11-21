"use client";

import type { ReactNode } from "react";
import { useSetSpotlight, useSpotlight } from "./spotlight";

/** A word in beat copy that lights the scene elements tagged with the same id. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const spot = useSpotlight();
  const setSpot = useSetSpotlight();
  const active = spot === id;
  const on = () => setSpot(id);
  const off = () => setSpot(spot === id ? null : spot);

  return (
    <button
      type="button"
      data-term={id}
      aria-pressed={active}
      onPointerEnter={on}
      onPointerLeave={off}
      onFocus={on}
      onBlur={off}
      onClick={() => setSpot(active ? null : id)}
      className="inline cursor-help rounded-sm text-fg underline decoration-accent/60 decoration-dotted underline-offset-4 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:decoration-accent aria-pressed:decoration-solid"
    >
      {children}
    </button>
  );
}
