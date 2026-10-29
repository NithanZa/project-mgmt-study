"use client";

import { AnimatePresence, motion } from "motion/react";

const STEPS = ["Identify", "Exploit", "Subordinate", "Elevate", "Repeat"];
/** First step and number of steps each beat highlights; the opening beat highlights none. */
const FOCUS: Partial<Record<number, [number, number]>> = { 1: [0, 1], 2: [1, 2], 3: [3, 1], 4: [4, 1] };

export function FocusingSteps({ beat }: { beat: number }) {
  const focus = FOCUS[beat];
  const active = (i: number) => focus !== undefined && i >= focus[0] && i < focus[0] + focus[1];
  return (
    <div className="relative min-w-0 flex-1">
      <AnimatePresence>
        {focus && (
          <motion.div
            layoutId="toc-focus"
            className="absolute inset-y-0 rounded-full border border-accent/40 bg-accent-soft"
            style={{ left: `${focus[0] * 20}%`, width: `${focus[1] * 20}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.18, ease: "easeOut" } }}
          />
        )}
      </AnimatePresence>
      <ol aria-label="Five focusing steps" className="relative grid grid-cols-5">
        {STEPS.map((step, i) => (
          <li
            key={step}
            aria-current={active(i) ? "step" : undefined}
            className={`py-1 text-center text-[10px] whitespace-nowrap sm:text-xs ${active(i) ? "font-semibold text-fg" : "text-muted"}`}
          >
            {active(i) ? (
              step
            ) : (
              <>
                <span aria-hidden className="sm:hidden">{i + 1}</span>
                <span className="sr-only sm:not-sr-only">{step}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
