"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSpot } from "@/components/lesson/spotlight";
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
  return RESOURCES.map((r, i) => (
    <Lane key={r} resource={r} demand={profile[r]} cap={capacities[r]} row={firstRow + i} />
  ));
}

/**
 * One resource lane. The label, the demand bars, the overload hatches and the
 * capacity line are sibling spotlight targets, so none dims another.
 */
function Lane({ resource: r, demand, cap, row }: { resource: Resource; demand: number[]; cap: number; row: number }) {
  const laneSpot = useSpot(r === "programmer" ? "programmer" : "lane");
  const overloadSpot = useSpot("overload");
  const capSpot = useSpot("capacity");
  const max = LANE_MAX[r];
  const pctOf = (units: number) => `${(units / max) * 100}%`;
  return (
    <>
      <div {...laneSpot} className="flex items-center pr-1 text-muted" style={{ gridRow: row }}>
        <span className="sm:hidden">{NAME[r][0]}</span>
        <span className="hidden sm:inline">{NAME[r][1]}</span>
      </div>
      <div data-lane={r} className="relative border-b border-line" style={{ gridRow: row, gridColumn: 2 }}>
        <div {...laneSpot} className="absolute inset-0 flex items-end">
          {DAYS.map((d) => (
            <motion.div
              key={d}
              className={`h-full flex-1 origin-bottom ${FILL[r]}`}
              initial={false}
              animate={{ scaleY: Math.min(demand[d] ?? 0, cap) / max }}
            />
          ))}
        </div>
        {/* Tagged on a wrapper: each hatch's own fade sets an inline opacity. */}
        <div {...overloadSpot} className="pointer-events-none absolute inset-0">
          <AnimatePresence initial={false}>
            {overloads(demand, cap).map((o) => (
              <motion.div
                key={`${o.start}-${o.units}`}
                data-overload={`${o.start}-${o.end}`}
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
        </div>
        <motion.div
          layout
          {...capSpot}
          data-cap={cap}
          className="absolute inset-x-0 border-t-2 border-dashed border-fg/70"
          style={{ bottom: pctOf(cap) }}
        >
          <span className="absolute -top-0.5 right-0 -translate-y-full font-semibold tabular-nums leading-none text-fg">
            {cap}
          </span>
        </motion.div>
      </div>
    </>
  );
}
