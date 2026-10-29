"use client";

import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { SceneProps } from "@/content/types";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { MAX_STREAMS, RUSH_CONFIRM, streamsFor } from "@/engine/monte-carlo/fixture";
import { pertTotal } from "@/engine/monte-carlo/simulate";
import { days, pct } from "@/lib/format";
import { ConvergenceBand } from "./convergence-band";
import { CriticalityBars } from "./criticality-bars";
import { Histogram } from "./histogram";
import { BAND_SEEDS, DEFAULT_STREAMS, MAX_RUNS, RUN_STOPS, band, simFor, warmBand } from "./model";
import { FADE } from "./scale";
import { StreamNetwork } from "./stream-network";

const BATCHES = [10, 100, 1000, 5000];
/** Below this many runs the quantiles are too noisy to mark. */
const MIN_QUANTILE_RUNS = 10;
/** Idle time needed before computing one more convergence seed. */
const IDLE_SLICE_MS = 15;

const shortDays = (v: number) => (Number.isFinite(v) ? `${v.toFixed(1)} d` : "–");
const count = (v: number) => Math.round(v).toLocaleString("en-US");

export function MonteCarloScene({ beat }: SceneProps) {
  const [k, setK] = useState(DEFAULT_STREAMS);
  const [runs, setRuns] = useState(0);
  const [rush, setRush] = useState(false);
  const [stop, setStop] = useState(0);
  const [roll, setRoll] = useState<number | null>(null);

  // Each beat isolates one variable; the others sit at the scenario default.
  const streams = beat === 2 ? k : DEFAULT_STREAMS;
  const rushed = beat === 3 && rush;
  const shownRuns = beat <= 1 ? runs : beat === 4 ? RUN_STOPS[stop] : MAX_RUNS;

  // The network reacts at once; the histogram follows when the simulation is ready.
  const simStreams = useDeferredValue(streams);
  const simRush = useDeferredValue(rushed);
  const fresh = simStreams === streams && simRush === rushed;
  const sim = simFor(simStreams, simRush);
  const view = useMemo(() => sim.upTo(shownRuns), [sim, shownRuns]);
  const pert = pertTotal({ streams, rush: rushed });
  const sample = beat === 0 && fresh && roll !== null ? sim.sample(roll) : null;
  const convergence = beat === 4 ? band() : null;
  const point = convergence?.[stop];

  useEffect(() => {
    // Warm beat 5's convergence a seed per idle slice while the learner reads.
    if (!("requestIdleCallback" in window)) return;
    let seed = 0;
    let id = 0;
    const step = (deadline: IdleDeadline) => {
      while (seed < BAND_SEEDS && deadline.timeRemaining() > IDLE_SLICE_MS) warmBand(seed++);
      if (seed < BAND_SEEDS) id = requestIdleCallback(step);
    };
    id = requestIdleCallback(step);
    return () => cancelIdleCallback(id);
  }, []);

  const reset = () => {
    setK(DEFAULT_STREAMS);
    setRuns(0);
    setRush(false);
    setStop(0);
    setRoll(null);
  };

  const rollOnce = () => {
    setRoll(runs);
    setRuns(runs + 1);
  };

  const shownStreams = streamsFor(streams, rushed);
  const quantiles = view.runs >= MIN_QUANTILE_RUNS ? { p50: view.p50, p80: view.p80 } : null;
  const label = [
    `Conference network, ${streams} parallel ${streams === 1 ? "stream" : "streams"}${rushed ? ", Speakers rushed" : ""}`,
    `${count(view.runs)} runs`,
    view.runs > 0 ? `P50 ${days(view.p50)}, P80 ${days(view.p80)}` : "no finish dates yet",
    `PERT ${days(pert)}`,
    sample ? `last roll finished at ${days(sample.finish)}, ${shownStreams[sample.longest].name} longest` : "",
    beat === 3 && fresh
      ? `critical share ${shownStreams.map((s, i) => `${s.name} ${pct(view.criticality[i])}`).join(", ")}`
      : "",
    point ? `P80 band ±${point.sd.toFixed(2)} days at ${count(point.runs)} runs` : "",
  ]
    .filter(Boolean)
    .join("; ");

  const controls = [
    <Button key="roll" variant="primary" onClick={rollOnce} disabled={runs >= MAX_RUNS}>
      Roll
    </Button>,
    <div key="batch" className="flex flex-col gap-1">
      <span className="text-xs text-muted">Run a batch (runs)</span>
      <div className="flex gap-1.5">
        {BATCHES.map((b) => (
          <Button
            key={b}
            aria-label={`Run ${count(b)} more`}
            onClick={() => setRuns((r) => Math.min(MAX_RUNS, r + b))}
            disabled={runs >= MAX_RUNS}
            className="px-2.5 tabular-nums"
          >
            +{count(b)}
          </Button>
        ))}
      </div>
    </div>,
    <Slider key="streams" label="Parallel streams" unit={k === 1 ? "stream" : "streams"} value={k} min={1} max={MAX_STREAMS} onChange={setK} />,
    <Toggle
      key="rush"
      label={`Rush Speakers (Confirm ${RUSH_CONFIRM.o}–${RUSH_CONFIRM.m}–${RUSH_CONFIRM.p} d)`}
      checked={rush}
      onChange={setRush}
    />,
    <Slider
      key="runs"
      label="Runs per simulation"
      unit="runs"
      value={stop}
      min={0}
      max={RUN_STOPS.length - 1}
      onChange={setStop}
      format={(i) => count(RUN_STOPS[i])}
    />,
  ][beat];

  const chart = beat <= 2 ? "histogram" : beat === 3 ? "criticality" : "convergence";

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="PERT" value={pert} format={shortDays} />
          <Readout label="P50" value={view.p50} format={shortDays} />
          <Readout label="P80" value={view.p80} format={shortDays} />
          <Readout label="Runs" value={view.runs} format={count} />
        </>
      }
      controls={
        controls && (
          <>
            {controls}
            <Button onClick={reset} className="ml-auto">
              Reset
            </Button>
          </>
        )
      }
    >
      <div className="grid h-full grid-cols-[3fr_2fr] gap-3 lg:grid-cols-1 lg:grid-rows-[2fr_3fr] lg:gap-6">
        <StreamNetwork streams={shownStreams} sample={sample} />
        <div className="relative min-h-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={chart}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
            >
              {chart === "histogram" && (
                <Histogram
                  bins={view.histogram}
                  pert={pert}
                  quantiles={quantiles}
                  roll={sample && roll !== null ? { key: roll, finish: sample.finish } : null}
                />
              )}
              {chart === "criticality" && <CriticalityBars streams={shownStreams} shares={view.criticality} />}
              {chart === "convergence" && convergence && point && (
                <ConvergenceBand points={convergence} runs={point.runs} estimate={view.p80} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SceneFrame>
  );
}

