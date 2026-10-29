"use client";

import { useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import type { SceneProps } from "@/content/types";
import { DEADLINE, MIGRATION, WIDE_PESSIMISTIC } from "@/engine/pert/fixture";
import { projectEstimate, withEstimate } from "@/engine/pert/pert";
import { pct } from "@/lib/format";
import { EstimateRow } from "./estimate-row";
import { commitDays } from "./format";
import { AXIS_H, AXIS_MAX, PAD, scaleX, sceneLayout } from "./geometry";
import { DEADLINE_MAX, DEADLINE_MIN, DeadlineHandle, ProjectCurve } from "./project-curve";
import { useSize } from "./use-size";

const WRITE = MIGRATION.find((t) => t.id === "write")!;
const BASE = projectEstimate(MIGRATION);
const CONFIDENCE = [50, 80, 90, 95].map((c) => ({ value: c, label: `${c}%` }));

const BEAT = { ranges: 0, expected: 1, project: 2, commit: 3, widen: 4 } as const;

const oneDecimal = (v: number) => `${v.toFixed(1)} d`;
const wholeDays = (v: number) => `${Math.round(v)} d`;
const percent = (v: number) => pct(v);

export function PertScene({ beat }: SceneProps) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const [deadline, setDeadline] = useState(DEADLINE);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [pessimistic, setPessimistic] = useState(WRITE.estimate.p);

  // Each beat shows its own state: the widened estimate only on the widen beat.
  const widen = beat === BEAT.widen ? pessimistic : WRITE.estimate.p;
  const tasks = useMemo(
    () => withEstimate(MIGRATION, WRITE.id, { ...WRITE.estimate, p: widen }),
    [widen],
  );
  const project = useMemo(() => projectEstimate(tasks), [tasks]);

  const curveMode = beat >= BEAT.project;
  const shownDeadline =
    beat === BEAT.commit ? deadline : beat === BEAT.project ? project.modeSum : DEADLINE;
  const probability = project.probabilityBy(shownDeadline);

  const moveDeadline = (d: number) => {
    setDeadline(d);
    setConfidence(null);
  };
  const reset = () => {
    setDeadline(DEADLINE);
    setConfidence(null);
    setPessimistic(WRITE.estimate.p);
  };

  const mean = project.expected.toFixed(1);
  const label = curveMode
    ? `Project curve: mean ${mean} days, sigma ${project.sigma.toFixed(1)} days, ${pct(probability)} chance of finishing by ${commitDays(shownDeadline)} days${beat === BEAT.widen ? `; ${WRITE.name} pessimistic ${widen} days` : ""}.`
    : beat === BEAT.ranges
      ? `Five migration tasks as ranges; the most-likely values sum to ${project.modeSum} days.`
      : `Expected durations sit right of the most-likely values; they sum to ${mean} days, not ${project.modeSum}.`;

  const readouts = curveMode ? (
    <>
      <Readout key="expected" label="Expected" value={project.expected} format={oneDecimal} />
      <Readout key="sigma" label="Sigma" value={project.sigma} format={oneDecimal} />
      <Readout key="p" label="P(by deadline)" value={probability} format={percent} />
    </>
  ) : (
    <>
      <Readout key="mode" label="Most likely" value={project.modeSum} format={wholeDays} />
      {beat === BEAT.expected && (
        <Readout key="expected" label="Expected" value={project.expected} format={oneDecimal} />
      )}
    </>
  );

  const controls =
    beat === BEAT.commit ? (
      <>
        <Slider
          label="Deadline"
          unit="days"
          value={deadline}
          min={DEADLINE_MIN}
          max={DEADLINE_MAX}
          step={0.5}
          format={commitDays}
          onChange={moveDeadline}
        />
        <Segmented
          label="Confidence"
          options={CONFIDENCE}
          value={confidence ?? -1}
          onChange={(c) => {
            setConfidence(c);
            setDeadline(BASE.daysFor(c / 100));
          }}
        />
        <Button key="reset" onClick={reset}>
          Reset
        </Button>
      </>
    ) : beat === BEAT.widen ? (
      <>
        <Slider
          label={`${WRITE.name}, pessimistic`}
          unit="days"
          value={pessimistic}
          min={6}
          max={WIDE_PESSIMISTIC}
          onChange={setPessimistic}
        />
        <Button key="reset" onClick={reset}>
          Reset
        </Button>
      </>
    ) : undefined;

  const layout = sceneLayout(height, curveMode, tasks.length);
  const x = scaleX(width);
  // Fixed density scale: a wider spread draws a lower, flatter bell.
  const bell = {
    mean: project.expected,
    sigma: project.sigma,
    amplitude: layout.amplitude * (BASE.sigma / project.sigma),
  };
  const ticks = Array.from({ length: AXIS_MAX / 2 + 1 }, (_, i) => i * 2).filter(
    (d) => width >= 480 || d % 4 === 0,
  );

  return (
    <SceneFrame label={label} readouts={readouts} controls={controls}>
      <div ref={ref} className="absolute inset-0">
        {width > 0 && (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="absolute inset-0 size-full overflow-visible"
              aria-hidden
            >
              <ProjectCurve
                bell={bell}
                x={x}
                base={layout.base}
                deadline={shownDeadline}
                visible={curveMode}
                compact={layout.compact}
              />
              {tasks.map((task, i) => (
                <EstimateRow
                  key={task.id}
                  task={task}
                  box={layout.rows[i]}
                  x={x}
                  right={width - PAD}
                  revealed={beat >= BEAT.expected}
                />
              ))}
              <g data-axis className="fill-muted text-[10px] tabular-nums">
                <line
                  x1={x(0)}
                  x2={x(AXIS_MAX)}
                  y1={layout.base}
                  y2={layout.base}
                  className="stroke-line"
                />
                {ticks.map((d) => (
                  <text key={d} x={x(d)} y={height - AXIS_H + 15} textAnchor="middle">
                    {d === AXIS_MAX ? `${d} d` : d}
                  </text>
                ))}
              </g>
            </svg>
            <DeadlineHandle
              x={x}
              width={width}
              top={layout.curveTop}
              base={layout.base}
              deadline={shownDeadline}
              probability={probability}
              visible={curveMode}
              interactive={beat === BEAT.commit}
              onChange={moveDeadline}
            />
          </>
        )}
      </div>
    </SceneFrame>
  );
}
