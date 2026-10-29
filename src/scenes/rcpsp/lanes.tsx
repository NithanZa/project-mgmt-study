"use client";

import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react";
import { RESOURCES, type Capacities, type Resource } from "@/engine/rcpsp/types";
import { AXIS_DAYS, atDay } from "./timeline";

const FADE = { duration: 0.18, ease: "easeOut" } as const;
/** Units at the top of each lane: the most the scene can ever show. */
const LANE_MAX: Record<Resource, number> = { programmer: 4, artist: 2 };
const FILL: Record<Resource, string> = { programmer: "bg-accent/35", artist: "bg-float/35" };
const NAME: Record<Resource, [short: string, long: string]> = {
  programmer: ["Prog", "Programmers"],
  artist: ["Art", "Artists"],
};
const DAYS = Array.from({ length: AXIS_DAYS }, (_, d) => d);

interface Overload {
  start: number;
  end: number;
  units: number;
}

/** Runs of consecutive days whose demand exceeds capacity. */
function overloads(demand: number[], capacity: number): Overload[] {
  const runs: Overload[] = [];
  demand.forEach((units, day) => {
    if (units <= capacity) return;
    const last = runs.at(-1);
    if (last && last.end === day && last.units === units) last.end = day + 1;
    else runs.push({ start: day, end: day + 1, units });
  });
  return runs;
}

/** Daily demand per resource against capacity; cells for a two-column parent grid. */
export function LaneRows({
  profile,
  capacities,
  firstRow,
}: {
  profile: Record<Resource, number[]>;
  capacities: Capacities;
  firstRow: number;
}) {
  return RESOURCES.map((r, i) => {
    const max = LANE_MAX[r];
    const cap = capacities[r];
    const pctOf = (units: number) => `${(units / max) * 100}%`;
    return (
      <Fragment key={r}>
        <div className="flex items-center pr-1 text-muted" style={{ gridRow: firstRow + i }}>
          <span className="sm:hidden">{NAME[r][0]}</span>
          <span className="hidden sm:inline">{NAME[r][1]}</span>
        </div>
        <div className="relative border-b border-line" style={{ gridRow: firstRow + i, gridColumn: 2 }}>
          <div className="absolute inset-0 flex items-end">
            {DAYS.map((d) => (
              <motion.div
                key={d}
                className={`h-full flex-1 origin-bottom ${FILL[r]}`}
                initial={false}
                animate={{ scaleY: Math.min(profile[r][d] ?? 0, cap) / max }}
              />
            ))}
          </div>
          <AnimatePresence initial={false}>
            {overloads(profile[r], cap).map((o) => (
              <motion.div
                key={`${o.start}-${o.units}`}
                className="hatch absolute border border-constraint text-constraint"
                style={{
                  left: atDay(o.start),
                  width: atDay(o.end - o.start),
                  bottom: pctOf(cap),
                  height: pctOf(o.units - cap),
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={FADE}
              />
            ))}
          </AnimatePresence>
          <motion.div
            layout
            className="absolute inset-x-0 border-t-2 border-dashed border-fg/70"
            style={{ bottom: pctOf(cap) }}
          >
            <span className="absolute -top-0.5 right-0 -translate-y-full font-semibold tabular-nums leading-none text-fg">
              {cap}
            </span>
          </motion.div>
        </div>
      </Fragment>
    );
  });
}
