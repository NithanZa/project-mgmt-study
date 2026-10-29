"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import type { SceneProps } from "@/content/types";
import { computeCriticalPath, withWeeks } from "@/engine/critical-path/cpm";
import { COFFEE_SHOP, PRESETS } from "@/engine/critical-path/fixture";
import type { CpmResult, Task } from "@/engine/critical-path/types";
import { GanttStrip } from "./gantt-strip";
import { TRANSITION } from "./motion";
import { Network, type Reveal } from "./network";
import { useSize } from "./use-size";

const REVEALS: Reveal[] = ["none", "forward", "backward", "all", "all"];
const SANDBOX_BEAT = 4;
const GANTT_BEAT = 3;
const RIPPLE_SECONDS = 1.2;
const GAP = 10;
const BASE = computeCriticalPath(COFFEE_SHOP);

const SHORT: Record<string, string> = { B: "Permits", C: "Reno", D: "Equip" };
const OPTIONS = [
  ...PRESETS.map((p) => ({
    value: p.task,
    label: `${SHORT[p.task]} ${p.weeks}`,
    tasks: withWeeks(COFFEE_SHOP, p.task, p.weeks),
  })),
  { value: "reset", label: "Reset", tasks: COFFEE_SHOP },
];

const sameWeeks = (a: Task[], b: Task[]) => a.every((t, i) => t.weeks === b[i].weeks);
const week = (v: number) => `week ${Math.round(v)}`;

function describe(reveal: Reveal, tasks: Task[], result: CpmResult): string {
  const network = `Network of ${tasks.length} tasks`;
  switch (reveal) {
    case "none":
      return `${network}, opening week not yet computed`;
    case "forward":
      return `${network}, forward pass: earliest finish week ${result.duration}`;
    case "backward": {
      const floats = tasks
        .filter((t) => result.rows[t.id].float > 0)
        .map((t) => `${t.id} ${result.rows[t.id].float}`);
      return `${network}, backward pass: float in weeks ${floats.join(", ")}`;
    }
    case "all": {
      const paths = result.criticalPaths.map((p) => p.join(" ")).join(" and ");
      const noun = result.criticalPaths.length > 1 ? "critical paths" : "critical path";
      return `${network}, ${noun} ${paths}, ${result.duration} weeks`;
    }
  }
}

export function CriticalPathScene({ beat }: SceneProps) {
  const reveal = REVEALS[beat] ?? "all";
  const sandbox = beat === SANDBOX_BEAT;
  const [draft, setDraft] = useState(COFFEE_SHOP);
  const [selected, setSelected] = useState<string | null>("C");
  const tasks = sandbox ? draft : COFFEE_SHOP;
  const result = useMemo(() => (tasks === COFFEE_SHOP ? BASE : computeCriticalPath(tasks)), [tasks]);

  const forward = useMotionValue(beat >= 2 ? 1 : 0);
  const backward = useMotionValue(beat >= 3 ? 1 : 0);
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);

  useEffect(() => {
    const play = (progress: typeof forward) => {
      progress.set(0);
      const controls = animate(progress, 1, {
        duration: reduced ? 0 : RIPPLE_SECONDS,
        ease: "linear",
      });
      return () => controls.stop();
    };
    if (reveal === "forward") {
      backward.set(0);
      return play(forward);
    }
    if (reveal === "backward") {
      forward.set(1);
      return play(backward);
    }
    const done = reveal === "all" ? 1 : 0;
    forward.set(done);
    backward.set(done);
  }, [reveal, run, reduced, forward, backward]);

  const [canvasRef, size] = useSize<HTMLDivElement>();
  const showGantt = beat >= GANTT_BEAT && size.height >= 150;
  const ganttH = showGantt ? Math.round(Math.min(size.height * 0.38, 210)) : 0;
  const networkH = size.height - (showGantt ? ganttH + GAP : 0);

  const preset = OPTIONS.find((o) => sameWeeks(draft, o.tasks))?.value ?? "custom";
  const selectedTask = draft.find((t) => t.id === selected);

  const controls =
    reveal === "forward" || reveal === "backward" ? (
      <Button onClick={() => setRun((n) => n + 1)}>Replay {reveal} pass</Button>
    ) : sandbox ? (
      <>
        <Segmented
          label="Preset (weeks)"
          options={OPTIONS.map(({ value, label }) => ({ value, label }))}
          value={preset}
          onChange={(value) => {
            const option = OPTIONS.find((o) => o.value === value)!;
            setDraft(option.tasks);
            if (value !== "reset") setSelected(value);
          }}
        />
        {selectedTask && (
          <Slider
            label={`${selectedTask.id} ${selectedTask.name}`}
            unit="weeks"
            value={selectedTask.weeks}
            min={1}
            max={10}
            onChange={(weeks) => setDraft(withWeeks(draft, selectedTask.id, weeks))}
          />
        )}
      </>
    ) : undefined;

  return (
    <SceneFrame
      label={
        sandbox && selectedTask
          ? `${describe(reveal, tasks, result)}; ${selectedTask.name} selected, ${selectedTask.weeks} ${selectedTask.weeks === 1 ? "week" : "weeks"}`
          : describe(reveal, tasks, result)
      }
      readouts={
        <>
          {beat >= 1 && <Readout label="Opening" value={result.duration} format={week} />}
          {beat >= GANTT_BEAT && <Readout label="Critical paths" value={result.criticalPaths.length} />}
        </>
      }
      controls={controls}
    >
      <div ref={canvasRef} className="absolute inset-0">
        {size.width > 0 && (
          <>
            <Network
              tasks={tasks}
              result={result}
              reveal={reveal}
              forward={forward}
              backward={backward}
              width={size.width}
              height={networkH}
              selected={sandbox ? selected : null}
              onSelect={sandbox ? setSelected : undefined}
            />
            <AnimatePresence initial={false}>
              {showGantt && (
                <motion.div
                  key="gantt"
                  data-gantt
                  className="absolute inset-x-0 bottom-0"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={TRANSITION}
                >
                  <GanttStrip result={result} width={size.width} height={ganttH} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </SceneFrame>
  );
}
