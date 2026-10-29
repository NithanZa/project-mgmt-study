"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Step } from "@/engine/vsm/types";
import { WASTE_LABEL } from "./map";
import { FADE } from "./motion";

export interface CalloutAnchor {
  /** Horizontal centre of the triangle, relative to the canvas. */
  x: number;
  /** Bottom of the triangle group, relative to the canvas. */
  y: number;
  canvasWidth: number;
}

const WIDTH = 208;
const MARGIN = 4;

export function WasteCallout({ step, anchor }: { step: Step | null; anchor: CalloutAnchor | null }) {
  const width = anchor ? Math.min(WIDTH, anchor.canvasWidth - 2 * MARGIN) : WIDTH;
  const left = anchor
    ? Math.max(MARGIN, Math.min(anchor.x - width / 2, anchor.canvasWidth - width - MARGIN))
    : 0;
  return (
    <AnimatePresence>
      {step && anchor ? (
        <motion.div
          key={step.id}
          data-callout
          aria-hidden
          className="pointer-events-none absolute z-10 rounded-md border border-line bg-surface px-3 py-2 shadow-md"
          style={{ left, top: anchor.y + 4, width }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADE}
        >
          <p className="flex items-baseline justify-between gap-2 text-[0.7rem] uppercase tracking-wide">
            <span className="font-semibold text-constraint">{WASTE_LABEL[step.waste]}</span>
            <span className="tabular-nums text-muted">
              {step.waitDays} d before {step.name}
            </span>
          </p>
          <p className="text-xs leading-snug text-fg">{step.reason}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
