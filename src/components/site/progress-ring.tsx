"use client";

import { m } from "motion/react";
import { SPRING_AND_FADE } from "@/components/transitions";

const R = 18;

/** Ring and count of completed lessons. Needs a LazyMotion ancestor. */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const fraction = done / total;
  return (
    <div data-progress className="flex shrink-0 items-center gap-3">
      <svg viewBox="0 0 44 44" className="size-11 -rotate-90" aria-hidden>
        <circle cx={22} cy={22} r={R} className="fill-none stroke-line" strokeWidth={4} />
        <m.circle
          cx={22}
          cy={22}
          r={R}
          className="fill-none stroke-ok"
          strokeWidth={4}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: fraction, opacity: done > 0 ? 1 : 0, transition: SPRING_AND_FADE }}
        />
      </svg>
      <p className="flex w-24 flex-col leading-tight">
        <span className="font-medium tabular-nums">
          {done} / {total}
        </span>{" "}
        <span className="text-xs text-muted">lessons done</span>
      </p>
    </div>
  );
}
