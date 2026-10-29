"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Legend } from "@/components/ui/legend";
import { Readout } from "@/components/ui/readout";
import { Slider } from "@/components/ui/slider";
import type { SceneProps } from "@/content/types";
import { HIRING, HOURS_PER_DAY, IMPROVEMENTS } from "@/engine/vsm/fixture";
import type { ImprovementId, StepId } from "@/engine/vsm/types";
import { applyImprovements, summary, withProcessHours } from "@/engine/vsm/vsm";
import { days } from "@/lib/format";
import { hours, percent } from "./format";
import { BeforeAfter, ImprovementToggles } from "./future-state";
import { Ladder } from "./ladder";
import { StreamMap } from "./map";
import { FADE } from "./motion";
import { type CalloutAnchor, WasteCallout } from "./waste-callout";

export const ONSITE = HIRING.find((s) => s.id === "onsite")!.processHours;
const ONSITE_MIN = 1;
const ONSITE_MAX = 8;
const CURRENT = summary(HIRING);
/** The longest lead time the controls can produce, so the ladder keeps one scale. */
const SCALE_DAYS = summary(withProcessHours(HIRING, "onsite", ONSITE_MAX)).leadTimeDays;
const NO_IMPROVEMENTS: ReadonlySet<ImprovementId> = new Set();

const BEAT = { ladder: 1, waste: 2, design: 3, tune: 4 } as const;

const LEGEND = [
  { label: "Work", swatch: "bg-accent" },
  { label: "Waiting", swatch: "hatch text-constraint" },
];

interface Inspected {
  id: StepId;
  anchor: CalloutAnchor;
}

export function VsmScene({ beat }: SceneProps) {
  const [improvements, setImprovements] = useState(NO_IMPROVEMENTS);
  const [onsiteHours, setOnsiteHours] = useState(ONSITE);
  const [inspected, setInspected] = useState<Inspected | null>(null);
  const [drawn, setDrawn] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);

  // Totals count up from zero as the map draws in.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const designing = beat >= BEAT.design;
  const tuning = beat === BEAT.tune;
  const steps = useMemo(() => {
    const improved = designing ? applyImprovements(HIRING, improvements) : HIRING;
    return tuning ? withProcessHours(improved, "onsite", onsiteHours) : improved;
  }, [designing, tuning, improvements, onsiteHours]);
  const totals = useMemo(() => summary(steps), [steps]);
  const pristine = improvements.size === 0 && onsiteHours === ONSITE;

  const toggle = (id: ImprovementId) =>
    setImprovements((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const reset = () => {
    setImprovements(NO_IMPROVEMENTS);
    setOnsiteHours(ONSITE);
  };
  const inspect = (id: StepId, target: SVGGElement) => {
    if (!canvas.current) return;
    const box = canvas.current.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    setInspected({
      id,
      anchor: { x: r.left + r.width / 2 - box.left, y: r.bottom - box.top, canvasWidth: box.width },
    });
  };
  const leave = (id: StepId) => setInspected((prev) => (prev?.id === id ? null : prev));

  const processHours = totals.processDays * HOURS_PER_DAY;
  const label =
    `Value stream map of hiring, ${steps.length} steps. Lead time ${days(totals.leadTimeDays)}, ` +
    `process time ${hours(processHours)}, efficiency ${percent(totals.efficiency)}` +
    (beat >= BEAT.ladder ? `; ${days(totals.waitDays)} of it waiting` : "") +
    (beat >= BEAT.waste ? "; each wait tagged with its waste" : "") +
    (designing ? `; ${improvements.size} of ${IMPROVEMENTS.length} improvements on` : "") +
    (tuning ? `; onsite ${hours(onsiteHours)}` : "") +
    ".";

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="Lead time" value={drawn ? totals.leadTimeDays : 0} format={days} />
          <Readout label="Process time" value={drawn ? processHours : 0} format={hours} />
          <Readout label="Efficiency" value={drawn ? totals.efficiency : 0} format={percent} />
        </>
      }
      controls={
        designing ? (
          <div className="flex w-full flex-col gap-2">
            {tuning && (
              <Slider
                label="Onsite length"
                unit="h"
                value={onsiteHours}
                min={ONSITE_MIN}
                max={ONSITE_MAX}
                onChange={setOnsiteHours}
              />
            )}
            {/* Reset keeps one place across both design beats and uses aria-disabled, so it never drops focus. */}
            <ImprovementToggles on={improvements} onToggle={toggle}>
              <Button
                onClick={pristine ? undefined : reset}
                aria-disabled={pristine}
                className="h-7! px-2! text-xs aria-disabled:cursor-default aria-disabled:opacity-40"
              >
                Reset
              </Button>
            </ImprovementToggles>
          </div>
        ) : undefined
      }
    >
      <div
        ref={canvas}
        className="relative flex h-full flex-col justify-center gap-2 overflow-hidden [container-type:size] lg:gap-10"
      >
        <StreamMap
          steps={steps}
          showWaste={beat >= BEAT.waste}
          active={inspected?.id ?? null}
          onInspect={inspect}
          onLeave={leave}
        />
        <motion.div
          className="flex shrink-0 flex-col gap-1.5 lg:gap-3"
          initial={false}
          animate={{ opacity: beat >= BEAT.ladder ? 1 : 0 }}
          transition={FADE}
        >
          <Ladder
            steps={steps}
            totals={totals}
            scaleDays={SCALE_DAYS}
            baselineDays={designing ? CURRENT.leadTimeDays : null}
          />
          <div className="flex min-h-4 flex-wrap items-center justify-between gap-x-3">
            {/* Phones lose canvas height to the controls on design beats; the legend gives way. */}
            <div className={designing ? "max-lg:hidden" : undefined}>
              <Legend items={LEGEND} />
            </div>
            <BeforeAfter before={designing ? CURRENT.leadTimeDays : null} after={totals.leadTimeDays} />
          </div>
        </motion.div>
        <WasteCallout
          step={steps.find((s) => s.id === inspected?.id) ?? null}
          anchor={inspected?.anchor ?? null}
        />
      </div>
    </SceneFrame>
  );
}
