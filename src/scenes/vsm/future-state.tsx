"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { IMPROVEMENTS } from "@/engine/vsm/fixture";
import type { ImprovementId } from "@/engine/vsm/types";
import { days } from "@/lib/format";
import { FADE } from "./motion";

interface TogglesProps {
  on: ReadonlySet<ImprovementId>;
  onToggle: (id: ImprovementId) => void;
  /** Trailing controls laid out in the same row, e.g. Reset. */
  children?: ReactNode;
}

/** One chip per improvement; each label names the step and its new wait. */
export function ImprovementToggles({ on, onToggle, children }: TogglesProps) {
  return (
    <div role="group" aria-label="Improvements" className="flex flex-wrap items-center gap-1.5">
      {IMPROVEMENTS.map((i) => {
        const pressed = on.has(i.id);
        return (
          <button
            key={i.id}
            type="button"
            aria-pressed={pressed}
            onClick={() => onToggle(i.id)}
            className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${pressed ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:text-fg"}`}
          >
            <span aria-hidden className="w-2.5 text-accent">
              {pressed ? "✓" : "+"}
            </span>
            {i.label}
          </button>
        );
      })}
      {children}
    </div>
  );
}

export function BeforeAfter({ before, after }: { before: number | null; after: number }) {
  return (
    <AnimatePresence initial={false}>
      {before !== null ? (
        <motion.p
          key="before-after"
          data-before-after
          className="flex gap-3 text-[0.65rem] tabular-nums text-muted lg:text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADE}
        >
          <span>
            Before <span className="font-semibold text-fg">{days(before)}</span>
          </span>
          <span>
            After <span className="font-semibold text-accent">{days(after)}</span>
          </span>
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
