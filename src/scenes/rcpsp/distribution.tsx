"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Rule } from "@/engine/rcpsp/types";

const FADE = { duration: 0.18, ease: "easeOut" } as const;
const LO = 12.5;
const HI = 30.5;
const SPANS = Array.from({ length: 18 }, (_, i) => i + 13);
const TICKS = [15, 20, 25, 30];
/** Pixels between rule dots that share a makespan; they sit side by side. */
const DOT_STEP = 10;

export const atSpan = (days: number) => `${((days - LO) / (HI - LO)) * 100}%`;

export interface RuleMark {
  rule: Rule;
  days: number;
}

export interface DistributionProps {
  lowerBound: number;
  /** Orders per makespan; null hides the histogram. */
  histogram: Record<number, number> | null;
  rules: RuleMark[];
  selected: Rule | null;
  /** Best makespan found so far; null hides the line. */
  best: number | null;
}

/** Makespans across all priority orders, with rule, optimum and lower-bound marks. */
export function Distribution({ lowerBound, histogram, rules, selected, best }: DistributionProps) {
  const counts = SPANS.map((d) => histogram?.[d] ?? 0);
  const tallest = Math.max(1, ...counts);
  const placed = rules.map(({ rule, days }, i) => {
    const same = rules.filter((r) => r.days === days);
    const slot = rules.slice(0, i).filter((r) => r.days === days).length;
    return { rule, days, shift: (slot - (same.length - 1) / 2) * DOT_STEP };
  });

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto_1.25rem] text-[10px] sm:text-xs">
      <div className="relative border-b border-fg/60">
        {SPANS.map((d, i) => (
          <motion.div
            key={d}
            className="absolute bottom-0 h-full origin-bottom rounded-t-sm bg-muted/45"
            style={{ left: atSpan(d - 0.35), width: atSpan(LO + 0.7) }}
            initial={false}
            animate={{ scaleY: counts[i] / tallest }}
          />
        ))}
        <div
          className="absolute inset-y-0 border-l-2 border-dashed border-constraint"
          style={{ left: atSpan(lowerBound) }}
        >
          <span className="absolute top-0 left-1 font-semibold text-constraint">{lowerBound}</span>
        </div>
        <AnimatePresence initial={false}>
          {best !== null && (
            <motion.div
              key="best"
              layout
              className="absolute inset-y-0 border-l-2 border-ok"
              style={{ left: atSpan(best) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: FADE }}
            >
              <span className="absolute -top-0.5 -left-[5px] size-2 rotate-45 bg-ok" />
              <span className="absolute top-0 left-1.5 font-semibold tabular-nums text-ok">{best}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="relative h-4 tabular-nums text-muted">
        {TICKS.map((d) => (
          <span key={d} className="absolute top-0.5 -translate-x-1/2 leading-none" style={{ left: atSpan(d) }}>
            {d}
          </span>
        ))}
      </div>
      <div className="relative">
        <AnimatePresence initial={false}>
          {placed.map(({ rule, days, shift }) => {
            const on = rule === selected;
            return (
              <motion.span
                key={rule}
                layout
                className={`absolute size-2 -translate-x-1/2 rounded-full border-2 ${on ? "z-10 scale-150 border-accent bg-accent" : "border-muted bg-surface"}`}
                style={{ left: `calc(${atSpan(days)} + ${shift}px)`, top: 4 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: FADE }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
