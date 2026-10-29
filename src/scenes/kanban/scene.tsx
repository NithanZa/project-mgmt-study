"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import type { SceneProps } from "@/content/types";
import { limited, push } from "@/engine/kanban/config";
import { BOARD, DAYS, LIMIT, MAX_LIMIT, OUTAGE, OUTAGE_DAYS, VARIABILITY } from "@/engine/kanban/fixture";
import { columnsAt, flowAt } from "@/engine/kanban/flow";
import { limitSweep } from "@/engine/kanban/sweep";
import { simulateLine, type LineConfig } from "@/lib/line-sim";
import { Board } from "./board";
import { Cfd } from "./cfd";
import { SweepChart } from "./sweep-chart";
import { usePlayback, type Speed } from "./use-playback";

interface Setup {
  /** Null means push: no limit. */
  limit: number | null;
  variability: boolean;
  /** First day Test is down, if the learner broke it. */
  outageFrom: number | null;
}

const BEAT = { push: 0, limit: 1, little: 2, outage: 3, sweep: 4 } as const;
const SLIDER_BEATS: number[] = [BEAT.limit, BEAT.little, BEAT.sweep];
/** Days left after an outage for the board to recover before the run ends. */
const RECOVERY = 15;
const FADE = { duration: 0.18, ease: "easeOut" } as const;

function preset(beat: number): Setup {
  const limit = beat === BEAT.push ? null : beat === BEAT.sweep ? 2 : LIMIT;
  return { limit, variability: false, outageFrom: null };
}

function toConfig({ limit, variability, outageFrom }: Setup): LineConfig {
  if (limit === null) return push();
  const outage = outageFrom === null ? undefined : { ...OUTAGE, from: outageFrom, to: outageFrom + OUTAGE_DAYS };
  return limited(limit, variability ? VARIABILITY : 0, outage);
}

const one = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const whole = (n: number) => String(Math.round(n));

export function KanbanScene({ beat }: SceneProps) {
  const [setup, setSetup] = useState(() => preset(beat));
  const [setupBeat, setSetupBeat] = useState(beat);
  if (beat !== setupBeat) {
    setSetupBeat(beat);
    setSetup(preset(beat));
  }
  const update = (patch: Partial<Setup>) => setSetup((s) => ({ ...s, ...patch }));

  const config = useMemo(() => toConfig(setup), [setup]);
  const result = useMemo(() => simulateLine(config), [config]);
  const sweeps = useMemo(() => ({ steady: limitSweep(0), noisy: limitSweep(VARIABILITY) }), []);
  const playback = usePlayback(String(beat), DAYS);
  const { tick } = playback;
  const flow = flowAt(result, tick);
  const columns = columnsAt(config, result, tick);
  const testDown = columns.some((c) => c.down);
  const outagePending = setup.outageFrom !== null && tick < setup.outageFrom + OUTAGE_DAYS;

  // Test breaks tomorrow; too close to the end to watch it recover, the run replays with the lesson's outage.
  const breakTest = () => {
    const late = tick + 1 + OUTAGE_DAYS + RECOVERY > DAYS;
    update({ outageFrom: late ? OUTAGE.from : tick + 1 });
    if (late) playback.restart();
  };
  const reset = () => {
    setSetup(preset(beat));
    playback.restart();
  };

  const panel = beat === BEAT.little ? "cfd" : beat === BEAT.sweep ? "sweep" : null;
  const label = `Kanban board, ${setup.limit === null ? "no WIP limit" : `WIP limit ${setup.limit} per column`}${setup.variability ? ", variability on" : ""}${testDown ? ", Test down" : ""}. Day ${tick + 1} of ${DAYS}: WIP ${flow.wip}, throughput ${one(flow.throughput)} per day, cycle time ${one(flow.cycleTime)} days.`;

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="WIP" value={flow.wip} format={whole} />
          <Readout label="Throughput / day" value={flow.throughput} format={one} />
          <Readout label="Cycle time days" value={flow.cycleTime} format={one} />
        </>
      }
      controls={
        SLIDER_BEATS.includes(beat) || beat === BEAT.outage ? (
          <>
            {SLIDER_BEATS.includes(beat) && (
              <Slider
                label="WIP limit"
                unit="per column"
                value={setup.limit ?? 1}
                min={1}
                max={MAX_LIMIT}
                onChange={(limit) => update({ limit })}
              />
            )}
            {beat === BEAT.sweep && (
              <Toggle label="Variability" checked={setup.variability} onChange={(variability) => update({ variability })} />
            )}
            {beat === BEAT.outage && (
              // aria-disabled rather than disabled, so a keyboard user's focus stays on the button.
              <Button
                onClick={outagePending ? undefined : breakTest}
                aria-disabled={outagePending}
                className="aria-disabled:cursor-default aria-disabled:opacity-40"
              >
                Test down for {OUTAGE_DAYS} days
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      <div className="relative flex h-full flex-col gap-2 sm:gap-3">
        <Playback {...playback} onReset={reset} className={panel ? "max-sm:hidden" : ""} />
        <Board
          columns={columns}
          limit={config.wipLimit}
          items={result.items}
          tick={tick}
          interval={playback.interval}
          className={panel ? "hidden flex-2 sm:grid" : "flex-1"}
        />
        <AnimatePresence initial={false} mode="popLayout">
          {panel && (
            <motion.div
              key={panel}
              className="min-h-0 flex-1 sm:flex-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
            >
              {panel === "cfd" ? (
                <Cfd stations={BOARD} result={result} tick={tick} throughput={flow.throughput} interval={playback.interval} />
              ) : (
                <SweepChart {...sweeps} variability={setup.variability} limit={setup.limit ?? 1} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SceneFrame>
  );
}

interface PlaybackProps {
  tick: number;
  playing: boolean;
  speed: Speed;
  toggle: () => void;
  setSpeed: (speed: Speed) => void;
  onReset: () => void;
  className: string;
}

function Playback({ tick, playing, speed, toggle, setSpeed, onReset, className }: PlaybackProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button variant="icon" className="size-7!" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
        <svg viewBox="0 0 12 12" className="size-3 fill-current" aria-hidden>
          {playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M2.5 1v10l8-5z" />}
        </svg>
      </Button>
      <Button
        variant="icon"
        className="size-auto! h-7! px-2! text-xs tabular-nums"
        aria-label={`Speed ${speed}×, switch to ${speed === 4 ? 1 : 4}×`}
        onClick={() => setSpeed(speed === 4 ? 1 : 4)}
      >
        {speed}×
      </Button>
      <Button variant="icon" className="size-auto! h-7! px-2! text-xs" onClick={onReset}>
        Reset
      </Button>
      <div className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 sm:max-w-48">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full origin-left rounded-full bg-accent"
            initial={false}
            animate={{ scaleX: (tick + 1) / DAYS }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <span data-day={tick + 1} className="w-12 text-right text-[11px] tabular-nums text-muted">
          day {tick + 1}
        </span>
      </div>
    </div>
  );
}
