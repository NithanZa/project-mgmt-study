"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useSpot } from "@/components/lesson/spotlight";
import type { Rule } from "@/engine/rcpsp/types";
import { RULE_LABEL } from "./rules";

const FADE = { duration: 0.18, ease: "easeOut" } as const;
const LO = 12.5;
const HI = 30.5;
const SPANS = Array.from({ length: 18 }, (_, i) => i + 13);
const TICKS = [15, 20, 25, 30];
/** Pixels between rule dots that share a makespan; they sit side by side. */
const DOT_STEP = 10;
/** Past this makespan the selected rule's name sits left of its dot, so it stays inside. */
const LABEL_FLIP = 24;

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
  /** The exact optimum, drawn as a faint mark the search heads for; null hides it. */
  target: number | null;
}

/** Makespans across all priority orders, with rule, optimum and lower-bound marks. */
export function Distribution({ lowerBound, histogram, rules, selected, best, target }: DistributionProps) {
  const [inspect, setInspect] = useState<number | null>(null);
  const lowerSpot = useSpot("lower-bound");
  const bestSpot = useSpot("best");
  const dotsSpot = useSpot("rule-dots");
  const counts = SPANS.map((d) => histogram?.[d] ?? 0);
  const tallest = Math.max(1, ...counts);
  const placed = rules.map(({ rule, days }, i) => {
    const same = rules.filter((r) => r.days === days);
    const slot = rules.slice(0, i).filter((r) => r.days === days).length;
    return { rule, days, shift: (slot - (same.length - 1) / 2) * DOT_STEP };
  });
  const chosen = placed.find((p) => p.rule === selected);
  const flip = chosen !== undefined && chosen.days > LABEL_FLIP;
  /** The name sits beyond the whole cluster of dots that share the chosen makespan. */
  const cluster = placed.filter((p) => p.days === chosen?.days).map((p) => p.shift);
  const labelShift = flip ? Math.min(...cluster) - DOT_STEP : Math.max(...cluster) + DOT_STEP;
  const leave = (d: number) => setInspect((v) => (v === d ? null : v));

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto_1.25rem] text-[10px] sm:text-xs">
      <div className="relative border-b border-fg/60">
        {SPANS.map((d, i) => {
          const count = counts[i];
          const on = histogram !== null && count > 0;
          return (
            <div
              key={d}
              data-hist={on ? count : undefined}
              data-hist-days={d}
              role={on ? "group" : undefined}
              tabIndex={on ? 0 : -1}
              aria-label={on ? `${count} orders take ${d} days` : undefined}
              aria-hidden={on ? undefined : true}
              className="absolute inset-y-0 rounded-t-sm outline-none focus-visible:outline-2 focus-visible:outline-accent"
              style={{ left: atSpan(d - 0.35), width: atSpan(LO + 0.7) }}
              onPointerEnter={() => on && setInspect(d)}
              onPointerLeave={() => leave(d)}
              onFocus={() => on && setInspect(d)}
              onBlur={() => leave(d)}
            >
              <motion.div
                className={`absolute inset-0 origin-bottom rounded-t-sm ${on && inspect === d ? "bg-muted/70" : "bg-muted/45"}`}
                initial={false}
                animate={{ scaleY: count / tallest }}
              />
              <AnimatePresence>
                {on && inspect === d && (
                  <motion.span
                    key="count"
                    className="absolute left-1/2 z-20 -translate-x-1/2 rounded-sm bg-fg px-1 font-semibold tabular-nums leading-tight text-surface"
                    style={{ bottom: `calc(${(count / tallest) * 100}% + 2px)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        <AnimatePresence initial={false}>
          {histogram !== null && (
            <motion.span
              key="orders"
              className="pointer-events-none absolute top-0 right-0 text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
            >
              orders
            </motion.span>
          )}
        </AnimatePresence>
        <div
          {...lowerSpot}
          data-lower-bound={lowerBound}
          className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-constraint"
          style={{ left: atSpan(lowerBound) }}
        >
          <span className="absolute top-0 left-1 whitespace-nowrap font-semibold text-constraint">
            {lowerBound} <span className="font-normal max-sm:hidden">people-free</span>
          </span>
        </div>
        {/* Tagged on a wrapper: the best line's own fade sets an inline opacity. */}
        <div {...bestSpot} className="pointer-events-none absolute inset-0">
          {target !== null && (
            <motion.div
              layout
              data-best-target={target}
              className="absolute inset-y-0 border-l-2 border-dashed border-ok/50"
              style={{ left: atSpan(target) }}
            />
          )}
          <AnimatePresence initial={false}>
            {best !== null && (
              <motion.div
                key="best"
                layout
                data-best={best}
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
      </div>
      <div className="relative h-4 tabular-nums text-muted">
        {/* Phones squeeze the strip to a few pixels; the bare numbers stay. */}
        <span className="absolute top-0.5 left-0 leading-none max-sm:hidden">days</span>
        {TICKS.map((d) => (
          <span key={d} className="absolute top-0.5 -translate-x-1/2 leading-none" style={{ left: atSpan(d) }}>
            {d}
          </span>
        ))}
      </div>
      {/* Tagged on the row: each dot's own fade sets an inline opacity. */}
      <div {...dotsSpot} className="relative">
        <AnimatePresence initial={false}>
          {placed.map(({ rule, days, shift }) => {
            const on = rule === selected;
            return (
              <motion.span
                key={rule}
                layout
                data-rule={rule}
                data-days={days}
                data-selected={on || undefined}
                className={`absolute size-2 -translate-x-1/2 rounded-full border-2 ${on ? "z-10 scale-150 border-accent bg-accent" : "border-muted bg-surface"}`}
                style={{ left: `calc(${atSpan(days)} + ${shift}px)`, top: 4 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: FADE }}
              />
            );
          })}
          {chosen && (
            <motion.span
              key="selected-label"
              layout
              data-rule-label={chosen.rule}
              className={`absolute top-0.5 whitespace-nowrap font-semibold leading-none text-accent ${flip ? "-translate-x-full" : ""}`}
              style={{ left: `calc(${atSpan(chosen.days)} + ${labelShift}px)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: FADE }}
            >
              {RULE_LABEL[chosen.rule]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
