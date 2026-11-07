"use client";

import { motion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { useSpot } from "@/components/lesson/spotlight";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { Toggle } from "@/components/ui/toggle";
import type { SceneProps } from "@/content/types";
import { cpm, earlySchedule } from "@/engine/resource-leveling/cpm";
import { DEFAULT_CAPACITIES, FEATURES } from "@/engine/resource-leveling/fixture";
import { level, levelWithinFloat, makespan, shift } from "@/engine/resource-leveling/level";
import { demand, overloadedDays, overloads, type Overload } from "@/engine/resource-leveling/profile";
import type { Capacities, Resource, Rule, Schedule } from "@/engine/resource-leveling/types";
import { Gantt } from "./gantt";
import { AXIS_DAYS, layout } from "./geometry";
import { Lanes } from "./lanes";
import { useSize } from "./use-size";

const CPM_ROWS = cpm(FEATURES).rows;
const MAX_START = Object.fromEntries(
  Object.entries(cpm(FEATURES, AXIS_DAYS).rows).map(([id, row]) => [id, row.ls]),
);
const EARLY = earlySchedule(FEATURES);
const WITHIN = levelWithinFloat(FEATURES, DEFAULT_CAPACITIES);
const LEVELED = level(FEATURES, DEFAULT_CAPACITIES, "min-lst");
const BY_RULE: Record<Rule, ReturnType<typeof level>> = {
  "min-lst": LEVELED,
  shortest: level(FEATURES, DEFAULT_CAPACITIES, "shortest"),
};
const DAYS = Array.from({ length: AXIS_DAYS + 1 }, (_, d) => d);

interface Controls {
  floatOn: boolean;
  levelOn: boolean;
  rule: Rule;
  capacities: Capacities;
  dragged: Schedule | null;
}

/** Every beat opens on these; `float` opens with its toggle off so the predict comes first. */
const INITIAL: Controls = {
  floatOn: false,
  levelOn: true,
  rule: "min-lst",
  capacities: DEFAULT_CAPACITIES,
  dragged: null,
};

const RULES: { value: Rule; label: string }[] = [
  { value: "min-lst", label: "Min LST" },
  { value: "shortest", label: "Shortest" },
];
const HEADCOUNT = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
];

interface View {
  schedule: Schedule;
  capacities: Capacities;
  flagged: readonly string[];
  /** Booking order to badge, or null when the schedule was not built by booking. */
  order: readonly string[] | null;
}

function view(beat: number, c: Controls): View {
  const plain = { capacities: DEFAULT_CAPACITIES, flagged: [], order: null };
  switch (beat) {
    case 0:
      return { ...plain, schedule: EARLY };
    case 1:
      return c.floatOn ? { ...plain, schedule: WITHIN.schedule, flagged: WITHIN.unresolved } : { ...plain, schedule: EARLY };
    case 2:
      return c.levelOn
        ? { ...plain, ...LEVELED }
        : { ...plain, schedule: WITHIN.schedule, flagged: WITHIN.unresolved };
    case 3:
      return { ...plain, ...BY_RULE[c.rule] };
    default:
      return {
        ...plain,
        schedule: c.dragged ?? level(FEATURES, c.capacities, "min-lst").schedule,
        capacities: c.capacities,
      };
  }
}

function describe(end: number, list: Overload[], flagged: readonly string[]) {
  const byResource = (r: Resource) => list.filter((o) => o.resource === r).map((o) => o.day);
  const parts = (["designer", "developer"] as const)
    .map((r) => [r, byResource(r)] as const)
    .filter(([, days]) => days.length > 0)
    .map(([r, days]) => `${r} on day${days.length > 1 ? "s" : ""} ${days.join(", ")}`);
  const count = overloadedDays(list);
  const load =
    count === 0 ? "no overloaded days" : `${count} overloaded day${count > 1 ? "s" : ""}: ${parts.join("; ")}`;
  const out = flagged.length > 0 ? ` ${flagged.join(", ")} out of float.` : "";
  return `Gantt of ${FEATURES.length} tasks above designer and developer load lanes. Ends day ${end}, ${load}.${out}`;
}

export function ResourceLevelingScene({ beat }: SceneProps) {
  const [saved, setSaved] = useState({ beat, ...INITIAL });
  const c: Controls = saved.beat === beat ? saved : INITIAL;
  const update = (patch: Partial<Controls>) => setSaved({ ...c, ...patch, beat });

  const { schedule, capacities, flagged, order } = useMemo(() => view(beat, c), [beat, c]);
  const end = makespan(schedule);
  const load = useMemo(() => demand(FEATURES, schedule, AXIS_DAYS), [schedule]);
  const list = useMemo(() => overloads(load, capacities), [load, capacities]);

  const [ref, size] = useSize<HTMLDivElement>();
  const geo = useMemo(() => size && layout(FEATURES, size.width, size.height), [size]);
  const hatch = `rl-hatch-${useId().replace(/[^\w-]/g, "")}`;
  const endSpot = useSpot("end");

  const setHeadcount = (r: Resource, n: number) =>
    update({ capacities: { ...c.capacities, [r]: n }, dragged: null });
  const pristine =
    c.dragged === null &&
    c.capacities.designer === DEFAULT_CAPACITIES.designer &&
    c.capacities.developer === DEFAULT_CAPACITIES.developer;

  const controls = [
    undefined,
    <Toggle key="f" label="Level within float" checked={c.floatOn} onChange={(floatOn) => update({ floatOn })} />,
    <Toggle key="l" label="Level" checked={c.levelOn} onChange={(levelOn) => update({ levelOn })} />,
    <Segmented key="r" label="Priority rule" options={RULES} value={c.rule} onChange={(rule) => update({ rule })} />,
    <>
      <Segmented
        label="Designers (people)"
        options={HEADCOUNT}
        value={c.capacities.designer}
        onChange={(n) => setHeadcount("designer", n)}
      />
      <Segmented
        label="Developers (people)"
        options={HEADCOUNT}
        value={c.capacities.developer}
        onChange={(n) => setHeadcount("developer", n)}
      />
      {/* aria-disabled rather than disabled, so a keyboard user's focus stays on the button. */}
      <Button
        aria-disabled={pristine}
        className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
        onClick={() => !pristine && update({ capacities: DEFAULT_CAPACITIES, dragged: null })}
      >
        Reset
      </Button>
    </>,
  ][beat];

  return (
    <SceneFrame
      label={describe(end, list, flagged)}
      readouts={
        <>
          <Readout label="End day" value={end} spot="end" />
          <Readout label="Overloaded days" value={overloadedDays(list)} />
        </>
      }
      controls={controls}
    >
      <div ref={ref} className="absolute inset-0">
        {geo && (
          <svg width={geo.width} height={geo.height} className="block select-none overflow-visible">
            <defs>
              <pattern id={hatch} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width={6} height={6} className="fill-constraint/15" />
                <line y2={6} strokeWidth={3} className="stroke-constraint" />
              </pattern>
            </defs>
            <g aria-hidden>
              {DAYS.map((d) => (
                <g key={d}>
                  <line
                    x1={geo.x0 + d * geo.dayW}
                    x2={geo.x0 + d * geo.dayW}
                    y1={geo.top}
                    y2={geo.bottom}
                    className="stroke-line"
                  />
                  {(geo.dayW >= geo.font * 1.8 || d % 2 === 0) && (
                    <text
                      x={geo.x0 + d * geo.dayW}
                      y={geo.axisY}
                      textAnchor="middle"
                      className="fill-muted tabular-nums"
                      style={{ fontSize: geo.font * 0.9 }}
                    >
                      {d}
                    </text>
                  )}
                </g>
              ))}
            </g>
            <Lanes load={load} capacities={capacities} geo={geo} hatch={hatch} />
            <Gantt
              tasks={FEATURES}
              schedule={schedule}
              geo={geo}
              rows={CPM_ROWS}
              showGhosts={beat <= 2}
              showFloat={beat === 1 || beat === 2}
              order={order ?? LEVELED.order}
              showOrder={order !== null}
              rank={c.rule}
              showRank={beat === 3}
              flagged={flagged}
              maxStart={MAX_START}
              onMove={
                beat === 4
                  ? (id, start, base) =>
                      update({ dragged: shift(base, FEATURES, id, Math.min(start, MAX_START[id])) })
                  : undefined
              }
            />
            <motion.line
              aria-hidden
              {...endSpot}
              data-end={end}
              y1={geo.top - 4}
              y2={geo.bottom}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              className="stroke-fg"
              initial={false}
              animate={{ x: geo.x0 + end * geo.dayW }}
            />
          </svg>
        )}
      </div>
    </SceneFrame>
  );
}
