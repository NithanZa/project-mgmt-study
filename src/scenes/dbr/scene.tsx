"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import type { SceneProps } from "@/content/types";
import { INSURED, ROPE, STARVED, TRY_IT, drum, push, type DrumSetting } from "@/engine/dbr/config";
import { DAYS, ORDERS, SHOP, WELD_INDEX } from "@/engine/dbr/fixture";
import { BUFFER_MAX, BUFFER_MIN, bufferSweep, meansOverSeeds } from "@/engine/dbr/sweep";
import { pct } from "@/lib/format";
import { simulateLine, type LineResult } from "@/lib/line-sim";
import { Shop, shopGeometry } from "./shop";
import { SweepChart } from "./sweep-chart";
import { usePlayback, type Speed } from "./use-playback";
import { useSize } from "./use-size";

type Release = "push" | "drum";
interface Setup extends DrumSetting {
  release: Release;
}

const BEAT = { push: 0, rope: 1, starved: 2, insured: 3, tryIt: 4 } as const;
const PRESETS: Setup[] = [
  { release: "push", ...ROPE },
  { release: "drum", ...ROPE },
  { release: "drum", ...STARVED },
  { release: "drum", ...INSURED },
  { release: "drum", ...TRY_IT },
];
const RELEASES: { value: Release; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "drum", label: "Drum" },
];
/** Below this canvas height the chart takes the shop's place instead of sitting under it. */
const STACK_MIN = 300;
const GAP = 12;
const FADE = { duration: 0.18, ease: "easeOut" } as const;

const two = (n: number) => String(Math.round(n * 100) / 100);
const one = (n: number) => String(Math.round(n * 10) / 10);
const noise = (v: number) => `±${Math.round(v * 100)}%`;

export function DbrScene({ beat }: SceneProps) {
  const [setup, setSetup] = useState(() => PRESETS[beat]);
  const [setupBeat, setSetupBeat] = useState(beat);
  if (beat !== setupBeat) {
    setSetupBeat(beat);
    setSetup(PRESETS[beat]);
  }
  const update = (patch: Partial<Setup>) => setSetup((s) => ({ ...s, ...patch }));

  const config = useMemo(
    () => (setup.release === "drum" ? drum(setup.bufferTarget, setup.variability) : push()),
    [setup],
  );
  const result = useMemo(() => simulateLine(config), [config]);
  const means = useMemo(() => meansOverSeeds(config), [config]);
  const sweep = useMemo(() => bufferSweep(setup.variability), [setup.variability]);
  const starvedDays = useMemo(() => starvation(result), [result]);
  const playback = usePlayback(JSON.stringify(config), DAYS);
  const tick = playback.tick;
  const rope = setup.release === "drum";

  const [canvasRef, size] = useSize<HTMLDivElement>();
  const stacked = size.height >= STACK_MIN;
  const showChart = beat >= BEAT.insured;
  const shopH = stacked ? Math.min(360, Math.round(size.height * 0.52)) : size.height;
  const chartY = stacked ? shopH + GAP : 0;

  const label = `Machine shop line, ${rope ? `drum release with a buffer target of ${setup.bufferTarget} items` : "push release"}, capacity variability ${noise(setup.variability)}. Weld busy ${pct(means.drumUtilization)}, throughput ${two(means.throughput)} items per day, cycle time ${one(means.cycleTime)} days, WIP ${one(means.wip)} items.`;

  const reset = () => {
    setSetup(PRESETS[beat]);
    playback.restart();
  };

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="Throughput" value={means.throughput} format={two} />
          <Readout label="Weld busy" value={means.drumUtilization} format={pct} />
          <Readout label="Cycle time" value={means.cycleTime} format={one} />
          <Readout label="WIP" value={means.wip} format={one} />
        </>
      }
      controls={controlsFor(beat, setup, update)}
    >
      <div className="flex h-full flex-col gap-2 sm:gap-3">
        <Playback
          {...playback}
          onReset={reset}
          starved={starvedDays}
          showStarved={rope}
        />
        <div ref={canvasRef} className="relative min-h-0 flex-1">
          {size.width > 0 && size.height > 0 && (
            <>
              <motion.div
                className="absolute inset-x-0 top-0"
                initial={false}
                animate={{
                  y: stacked && !showChart ? (size.height - shopH) / 2 : 0,
                  opacity: !stacked && showChart ? 0 : 1,
                }}
                transition={{ opacity: FADE }}
              >
                <Shop
                  geometry={shopGeometry(size.width, shopH, SHOP.length)}
                  stations={SHOP}
                  drum={WELD_INDEX}
                  state={result.ticks[tick]}
                  tick={tick}
                  interval={playback.interval}
                  arrivals={ORDERS}
                  rope={rope}
                  bufferTarget={setup.bufferTarget}
                  gaugeMax={BUFFER_MAX}
                />
              </motion.div>
              <AnimatePresence>
                {showChart && (
                  <motion.div
                    key="sweep"
                    className="absolute inset-x-0"
                    style={{ top: chartY }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE}
                  >
                    <SweepChart
                      width={size.width}
                      height={size.height - chartY}
                      points={sweep}
                      bufferTarget={setup.bufferTarget}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </SceneFrame>
  );
}

/** Days on which the drum had capacity but nothing to work on. */
function starvation(result: LineResult): boolean[] {
  return result.ticks.map((t) => t.caps[WELD_INDEX] > t.processed[WELD_INDEX]);
}

function controlsFor(beat: number, setup: Setup, update: (patch: Partial<Setup>) => void) {
  if (beat === BEAT.rope)
    return (
      <Segmented label="Release" options={RELEASES} value={setup.release} onChange={(release) => update({ release })} />
    );
  if (beat >= BEAT.starved)
    return (
      <div className="flex w-full gap-4 [&>*]:min-w-0">
        <Slider
          label="Variability"
          unit="daily"
          value={setup.variability}
          min={0}
          max={1}
          step={0.1}
          format={noise}
          onChange={(variability) => update({ variability })}
        />
        <Slider
          label="Buffer target"
          unit="items"
          value={setup.bufferTarget}
          min={BUFFER_MIN}
          max={BUFFER_MAX}
          onChange={(bufferTarget) => update({ bufferTarget })}
        />
      </div>
    );
  return undefined;
}

interface PlaybackProps {
  tick: number;
  playing: boolean;
  speed: Speed;
  toggle: () => void;
  setSpeed: (speed: Speed) => void;
  onReset: () => void;
  starved: boolean[];
  showStarved: boolean;
}

function Playback({ tick, playing, speed, toggle, setSpeed, onReset, starved, showStarved }: PlaybackProps) {
  const starvedSoFar = starved.slice(0, tick + 1).filter(Boolean).length;
  return (
    <div className="flex items-center gap-1.5">
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
      <svg
        viewBox={`0 0 ${starved.length} 10`}
        preserveAspectRatio="none"
        className="ml-1 h-3.5 min-w-0 flex-1"
        aria-hidden
        data-days={tick + 1}
      >
        {starved.map((s, d) => {
          const past = d <= tick;
          const mark = past && s && showStarved;
          return (
            <rect
              key={d}
              x={d + 0.15}
              width={0.7}
              y={mark ? 0 : 3.5}
              height={mark ? 10 : 3}
              className={mark ? "fill-constraint" : past ? "fill-fg/45" : "fill-line"}
            />
          );
        })}
      </svg>
      <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-muted" data-day>
        day {tick + 1}
      </span>
      {showStarved && (
        <span className="shrink-0 text-[11px] tabular-nums text-constraint" data-starved={starvedSoFar}>
          <span aria-hidden>!</span> {starvedSoFar}
          <span className="sr-only"> starved days</span>
        </span>
      )}
    </div>
  );
}
