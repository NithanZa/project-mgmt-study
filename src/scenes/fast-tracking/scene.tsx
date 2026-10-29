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

const NONE: readonly number[] = [];
const FOUNDATIONS: readonly number[] = [0];
const ALL: readonly number[] = [0, 1, 2];
const draggableOn = (beat: number) => (beat === 0 ? NONE : beat <= 2 ? FOUNDATIONS : ALL);

/** Overlaps a beat starts from: beat 1 is sequential, beats 2–3 only overlap Foundations. */
function enter(beat: number, overlaps: Overlaps): Overlaps {
  if (beat === 0) return SEQUENTIAL;
  if (beat <= 2 && (overlaps[1] !== 0 || overlaps[2] !== 0)) return [overlaps[0], 0, 0];
  return overlaps;
}

const sameOverlaps = (a: Overlaps, b: Overlaps) => a.every((o, i) => o === b[i]);
const finish = (d: number) => `${Math.round(d)} d`;

export function FastTrackingScene({ beat }: SceneProps) {
  const [overlaps, setOverlaps] = useState<Overlaps>(SEQUENTIAL);
  const [active, setActive] = useState(0);
  const [shownBeat, setShownBeat] = useState(beat);
  if (beat !== shownBeat) {
    setShownBeat(beat);
    setOverlaps(enter(beat, overlaps));
    if (beat <= 2) setActive(0);
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
    (beat >= 1
      ? ` ${HOUSE[active + 1].name}: ${pct(edge.risk)} rework risk, ${days(edge.expectedRework)} expected rework.`
      : "") +
    (beat >= 2 ? ` Net saving peaks at ${days(PRESETS.balanced[active])} of overlap.` : "") +
    (beat >= 3 && preset ? ` Preset: ${PRESET_OPTIONS.find((o) => o.value === preset)!.label}.` : "");

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
        beat >= 3 ? (
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
            pulse={beat === 1 && overlaps[0] === 0}
            onOverlap={onOverlap}
            onActivate={setActive}
          />
        </div>
        <div className="hidden min-h-0 flex-[2] grid-cols-[3fr_2fr] grid-rows-[minmax(0,1fr)] gap-3 px-3 [@container(min-height:170px)]:grid">
          <AnimatePresence initial={false}>
            {beat >= 2 && <NetCurve key={active} edge={active} overlap={overlaps[active]} />}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {beat >= 1 && (
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
