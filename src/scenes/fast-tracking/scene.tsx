"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import type { SceneProps } from "@/content/types";
import { HOUSE, MAX_OVERLAP } from "@/engine/fast-tracking/fixture";
import { bestOverlaps, schedule } from "@/engine/fast-tracking/schedule";
import type { Overlaps } from "@/engine/fast-tracking/types";
import { days, pct } from "@/lib/format";
import { Gantt } from "./gantt";
import { NetCurve } from "./net-curve";
import { RiskMeters } from "./risk-meters";

type Preset = "sequential" | "balanced" | "max";

const SEQUENTIAL: Overlaps = [0, 0, 0];
const PRESETS: Record<Preset, Overlaps> = {
  sequential: SEQUENTIAL,
  balanced: bestOverlaps(),
  max: MAX_OVERLAP,
};
const PRESET_OPTIONS: { value: Preset; label: string }[] = [
  { value: "sequential", label: "Sequential" },
  { value: "balanced", label: "Balanced" },
  { value: "max", label: "Max" },
];
const FADE = { duration: 0.18, ease: "easeOut" } as const;

export const BEAT = {
  sequential: 0,
  drag: 1,
  risk: 2,
  sweetSpot: 3,
  presets: 4,
  try: 5,
} as const;

const NONE: readonly number[] = [];
const FOUNDATIONS: readonly number[] = [0];
const ALL: readonly number[] = [0, 1, 2];
const draggableOn = (beat: number) =>
  beat === BEAT.sequential ? NONE : beat <= BEAT.sweetSpot ? FOUNDATIONS : ALL;

/**
 * Overlaps a beat starts from: the first beat is sequential, the beats up to the sweet spot
 * only overlap Foundations, and the risk beat needs some overlap for its tint to show.
 */
function enter(beat: number, overlaps: Overlaps): Overlaps {
  if (beat === BEAT.sequential) return SEQUENTIAL;
  let next = overlaps;
  if (beat <= BEAT.sweetSpot && (next[1] !== 0 || next[2] !== 0)) next = [next[0], 0, 0];
  if (beat === BEAT.risk && next[0] === 0) next = [PRESETS.balanced[0], next[1], next[2]];
  return next;
}

const sameOverlaps = (a: Overlaps, b: Overlaps) => a.every((o, i) => o === b[i]);
const finish = (d: number) => `${Math.round(d)} d`;

export function FastTrackingScene({ beat }: SceneProps) {
  // A lesson resumed mid-way starts from the overlaps its beat would have entered with.
  const [overlaps, setOverlaps] = useState<Overlaps>(() => enter(beat, SEQUENTIAL));
  const [active, setActive] = useState(0);
  const [shownBeat, setShownBeat] = useState(beat);
  if (beat !== shownBeat) {
    setShownBeat(beat);
    setOverlaps(enter(beat, overlaps));
    if (beat <= BEAT.sweetSpot) setActive(0);
  }

  const result = useMemo(() => schedule(overlaps), [overlaps]);
  const preset = (Object.keys(PRESETS) as Preset[]).find((p) => sameOverlaps(PRESETS[p], overlaps));

  const onOverlap = useCallback((edge: number, overlap: number) => {
    setOverlaps((prev) => {
      if (prev[edge] === overlap) return prev;
      const next: Overlaps = [...prev];
      next[edge] = overlap;
      return next;
    });
  }, []);

  const edge = result.edges[active];
  const label =
    `House schedule. Overlaps: ${HOUSE.slice(1)
      .map((p, i) => `${HOUSE[i].name} to ${p.name} ${days(overlaps[i])}`)
      .join(", ")}. ` +
    `Planned finish ${days(result.planned)}, expected finish ${days(result.expected)}.` +
    (beat >= BEAT.drag
      ? ` ${HOUSE[active + 1].name}: ${pct(edge.risk)} rework risk, ${days(edge.expectedRework)} expected rework.`
      : "") +
    (beat >= BEAT.risk && edge.saved > 0
      ? ` ${HOUSE[active].name} is ${pct(edge.risk)} unfinished when ${HOUSE[active + 1].name} starts.`
      : "") +
    (beat >= BEAT.sweetSpot ? ` Net saving peaks at ${days(PRESETS.balanced[active])} of overlap.` : "") +
    (beat >= BEAT.presets && preset
      ? ` Preset: ${PRESET_OPTIONS.find((o) => o.value === preset)!.label}.`
      : "");

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="Planned" value={result.planned} format={finish} />
          <Readout label="Expected" value={result.expected} format={finish} />
          <Readout label="Rework risk" value={edge.risk} format={(r) => pct(r)} />
        </>
      }
      controls={
        beat >= BEAT.presets ? (
          <>
            <Segmented<Preset | "custom">
              label="Overlap preset"
              options={PRESET_OPTIONS}
              value={preset ?? "custom"}
              onChange={(p) => p !== "custom" && setOverlaps(PRESETS[p])}
            />
            <Button
              onClick={() => {
                setOverlaps(SEQUENTIAL);
                setActive(0);
              }}
            >
              Reset
            </Button>
          </>
        ) : undefined
      }
    >
      {/* A size container: on short canvases (phones with controls) the Gantt keeps the space. */}
      <div data-canvas className="flex h-full flex-col gap-2 [container-type:size]">
        <div className="min-h-0 flex-[3]">
          <Gantt
            result={result}
            overlaps={overlaps}
            draggable={draggableOn(beat)}
            pulse={beat === BEAT.drag && overlaps[0] === 0}
            connectors={beat === BEAT.sequential}
            unfinished={beat >= BEAT.risk}
            onOverlap={onOverlap}
            onActivate={setActive}
          />
        </div>
        <div className="hidden min-h-0 flex-[2] grid-cols-[3fr_2fr] grid-rows-[minmax(0,1fr)] gap-3 px-3 [@container(min-height:170px)]:grid">
          <AnimatePresence initial={false}>
            {beat >= BEAT.sweetSpot && <NetCurve key={active} edge={active} overlap={overlaps[active]} />}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {beat >= BEAT.drag && (
              <motion.div
                key="meters"
                className="col-start-2 row-start-1 min-h-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={FADE}
              >
                <RiskMeters edges={result.edges} active={active} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SceneFrame>
  );
}
