"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import type { SceneProps } from "@/content/types";
import { fever } from "@/engine/critical-chain/fever";
import { clashes } from "@/engine/critical-chain/schedule";
import type { BufferMethod, Buffers } from "@/engine/critical-chain/types";
import { days, pct } from "@/lib/format";
import { FeverChart } from "./fever-chart";
import { Gantt } from "./gantt";
import {
  CHAINS,
  COMMITTED,
  HALF,
  OVERRUN_MAX,
  PLAN,
  RSS,
  SAFE,
  FEASIBLE_FLOAT,
  TASKS,
  UNCONSTRAINED,
  nameOf,
  names,
} from "./model";
import { FADE } from "./motion";

const VIEWS = {
  unconstrained: {
    schedule: UNCONSTRAINED,
    chain: CHAINS.unconstrained,
    mode: "Safe estimates, no resource limits",
  },
  feasible: { schedule: SAFE, chain: CHAINS.feasible, mode: "Safe estimates, one developer" },
  buffered: { schedule: PLAN, chain: CHAINS.buffered, mode: "50% estimates with shared buffers" },
};
const CLASHES = clashes(TASKS, UNCONSTRAINED);
type ViewId = keyof typeof VIEWS;
const VIEW_BY_BEAT: ViewId[] = ["unconstrained", "feasible", "buffered", "buffered", "buffered"];
const FEVER_BEAT = 3;
const TRY_BEAT = 4;
const NO_FLOAT: Record<string, number> = {};
const NO_CLASHES: typeof CLASHES = [];
const INITIAL = { cms: 0, pages: 0 };
const METHODS: { value: BufferMethod; label: string }[] = [
  { value: "half", label: "Half" },
  { value: "rss", label: "Root-sum-square" },
];

function describe(viewId: ViewId, buffers: Buffers): string {
  const { schedule, chain, mode } = VIEWS[viewId];
  const length = days(schedule.makespan);
  switch (viewId) {
    case "unconstrained": {
      const clash = CLASHES.map((c) => `the ${c.resource} is double-booked from day ${c.from} to ${c.to}`);
      return `${mode}. Critical path ${names(chain.ids)}, ${length}; ${clash.join(", ")}.`;
    }
    case "feasible": {
      const links = chain.links
        .filter((l) => l.kind === "resource")
        .map((l) => `${nameOf(l.from)} to ${nameOf(l.to)}`);
      const floats = Object.entries(FEASIBLE_FLOAT).map(([id, f]) => `${nameOf(id)} has ${days(f)} of float`);
      return `${mode}. Critical chain ${names(chain.ids)}, ${length}, with a resource link ${links.join(", ")}; ${floats.join(", ")}.`;
    }
    case "buffered": {
      const feeding = buffers.feeding.map((f) => `feeding buffer ${days(f.days)} before ${nameOf(f.before)}`);
      return `${mode}. Chain ${length}, project buffer ${days(buffers.project.days)}, ${feeding.join(", ")}.`;
    }
  }
}

const dayLabel = (v: number) => `Day ${Math.round(v)}`;
const wholeDays = (v: number) => days(Math.round(v));

export function CriticalChainScene({ beat }: SceneProps) {
  const [overruns, setOverruns] = useState(INITIAL);
  const [method, setMethod] = useState<BufferMethod>("half");

  const viewId = VIEW_BY_BEAT[Math.min(beat, VIEW_BY_BEAT.length - 1)];
  const view = VIEWS[viewId];
  const buffered = viewId === "buffered";
  const fevering = beat >= FEVER_BEAT;
  const trying = beat >= TRY_BEAT;
  const activeMethod = trying ? method : "half";
  const buffers = activeMethod === "rss" ? RSS : HALF;
  const committed = buffered ? COMMITTED[activeMethod] : view.schedule.makespan;

  const status = useMemo(() => {
    const reported = !fevering ? {} : trying ? overruns : { cms: overruns.cms };
    return fever(TASKS, reported, activeMethod);
  }, [fevering, trying, overruns, activeMethod]);
  const consumed = fevering ? status.bufferUsed * buffers.project.days : 0;

  const reset = () => {
    setOverruns(INITIAL);
    setMethod("half");
  };
  const isInitial = overruns.cms === 0 && overruns.pages === 0 && method === "half";

  const label = [
    describe(viewId, buffers),
    `Committed date day ${committed}.`,
    fevering &&
      `Fever zone ${status.zone}: ${pct(status.bufferUsed)} of the buffer used at ${pct(status.chainComplete)} of the chain complete.`,
  ]
    .filter(Boolean)
    .join(" ");

  const cmsSlider = (
    <Slider
      label="CMS overrun"
      unit="days"
      value={overruns.cms}
      min={0}
      max={OVERRUN_MAX.cms}
      onChange={(cms) => setOverruns((o) => ({ ...o, cms }))}
    />
  );
  const resetButton = (
    // aria-disabled rather than disabled, so a keyboard user's focus stays on the button.
    <Button
      aria-disabled={isInitial}
      className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
      onClick={() => !isInitial && reset()}
    >
      Reset
    </Button>
  );

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="Committed date" value={committed} format={dayLabel} />
          <Readout label="Chain" value={view.schedule.makespan} format={wholeDays} />
          <Readout label="Buffer" value={buffered ? buffers.project.days : 0} format={wholeDays} />
        </>
      }
      controls={
        trying ? (
          <>
            {/* Children drop their min width so both sliders share one row on phones. */}
            <div className="flex flex-[2_1_18rem] gap-4 *:min-w-0">
              {cmsSlider}
              <Slider
                label="Pages overrun"
                unit="days"
                value={overruns.pages}
                min={0}
                max={OVERRUN_MAX.pages}
                onChange={(pages) => setOverruns((o) => ({ ...o, pages }))}
              />
            </div>
            <Segmented
              label="Project buffer sizing"
              options={METHODS}
              value={method}
              onChange={setMethod}
            />
            {resetButton}
          </>
        ) : fevering ? (
          <>
            {cmsSlider}
            {resetButton}
          </>
        ) : undefined
      }
    >
      <div className="flex h-full flex-col gap-3">
        <div className={`min-h-0 ${fevering ? "flex-[2] max-lg:hidden" : "flex-1"}`}>
          <Gantt
            tasks={TASKS}
            schedule={view.schedule}
            chain={view.chain}
            float={viewId === "feasible" ? FEASIBLE_FLOAT : NO_FLOAT}
            buffers={buffers}
            showBuffers={buffered}
            consumed={consumed}
            clashes={viewId === "unconstrained" ? CLASHES : NO_CLASHES}
            lane="developer"
            laneLabel="Developer"
            finish={committed}
          />
        </div>
        <AnimatePresence initial={false}>
          {fevering && (
            <motion.div
              key="fever"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="relative min-h-0 flex-[3]"
            >
              <FeverChart status={status} points={CHAINS.buffered.ids.length + 1} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SceneFrame>
  );
}
