"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import type { SceneProps } from "@/content/types";
import { BAKERY, CLEANING_LOSS, DEMAND, HOURS, OVEN } from "@/engine/toc/fixture";
import { baseline, exploitLoss, invest, investDeltas, subordinate } from "@/engine/toc/scenarios";
import { MARKET, simulateLine, type LineConfig } from "@/lib/line-sim";
import { FocusingSteps } from "./focusing-steps";
import { InvestPanel } from "./invest-panel";
import { Line } from "./line";
import { usePlayback, type Speed } from "./use-playback";

interface Setup {
  capacities: Record<string, number>;
  cleaningLoss: boolean;
  subordinate: boolean;
  invested: string | null;
  tried: string[];
  selected: string;
}

const BEAT = { identify: 1, exploit: 2, elevate: 3, repeat: 4 } as const;
const OVEN_BASE = BAKERY.find((s) => s.id === OVEN)?.capacity ?? 0;
const MULTIPLIERS = [1, 1.5, 2].map((m) => ({ value: m, label: `×${m}` }));
const ovenAt = (m: number) => Math.floor(OVEN_BASE * m);
const DELTAS = investDeltas();

function preset(beat: number): Setup {
  const capacities = Object.fromEntries(BAKERY.map((s) => [s.id, s.capacity]));
  if (beat === BEAT.repeat) capacities[OVEN] = ovenAt(2);
  return { capacities, cleaningLoss: false, subordinate: false, invested: null, tried: [], selected: OVEN };
}

function toConfig(setup: Setup): LineConfig {
  let config: LineConfig = {
    ...baseline(),
    stations: BAKERY.map((s) => ({ ...s, capacity: setup.capacities[s.id] })),
  };
  if (setup.invested) config = invest(config, setup.invested);
  config = exploitLoss(config, setup.cleaningLoss);
  return setup.subordinate ? subordinate(config) : config;
}

const one = (n: number) => String(Math.round(n * 10) / 10);
const whole = (n: number) => String(Math.round(n));

export function TocScene({ beat }: SceneProps) {
  const [setup, setSetup] = useState(() => preset(beat));
  const [setupBeat, setSetupBeat] = useState(beat);
  if (beat !== setupBeat) {
    setSetupBeat(beat);
    setSetup(preset(beat));
  }
  const update = (patch: Partial<Setup>) => setSetup((s) => ({ ...s, ...patch }));

  const config = useMemo(() => toConfig(setup), [setup]);
  const result = useMemo(() => simulateLine(config), [config]);
  const playback = usePlayback(JSON.stringify(config), HOURS);

  const constraintName =
    result.constraint === MARKET ? "the market" : config.stations.find((s) => s.id === result.constraint)?.name;
  const label = `Bakery line. ${beat >= BEAT.identify ? `Constraint: ${constraintName}. ` : ""}Throughput ${one(result.throughput)} loaves per hour against orders of ${DEMAND}; cycle time ${one(result.avgCycleTime)} hours; ${whole(result.avgWip)} loaves in progress.`;

  const reset = () => {
    setSetup(preset(beat));
    playback.restart();
  };

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="Throughput / h" value={result.throughput} format={one} />
          <Readout label="Cycle time h" value={result.avgCycleTime} format={one} />
          <Readout label="WIP" value={result.avgWip} format={whole} />
        </>
      }
      controls={controlsFor(beat, setup, update)}
    >
      <div className="flex h-full flex-col gap-2 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-4">
          <Playback {...playback} onReset={reset} hours={HOURS} />
          <FocusingSteps beat={beat} />
        </div>
        <Line
          config={config}
          result={result}
          tick={playback.tick}
          interval={playback.interval}
          playing={playback.playing}
          revealConstraint={beat >= BEAT.identify}
          showBusy={beat >= BEAT.identify}
          selected={beat === BEAT.repeat ? setup.selected : undefined}
          onSelect={beat === BEAT.repeat ? (selected) => update({ selected }) : undefined}
        />
      </div>
    </SceneFrame>
  );
}

function controlsFor(beat: number, setup: Setup, update: (patch: Partial<Setup>) => void) {
  if (beat === BEAT.exploit)
    return (
      <>
        <Toggle
          label={`Cleaning loss ${CLEANING_LOSS * 100}%`}
          checked={setup.cleaningLoss}
          onChange={(cleaningLoss) => update({ cleaningLoss })}
        />
        <Toggle
          label="Oven-paced release"
          checked={setup.subordinate}
          onChange={(on) => update({ subordinate: on })}
        />
      </>
    );
  if (beat === BEAT.elevate)
    return (
      <InvestPanel
        stations={BAKERY}
        deltas={DELTAS}
        invested={setup.invested}
        tried={setup.tried}
        onInvest={(id) =>
          update({ invested: id, tried: setup.tried.includes(id) ? setup.tried : [...setup.tried, id] })
        }
      />
    );
  if (beat === BEAT.repeat) {
    const station = BAKERY.find((s) => s.id === setup.selected) ?? BAKERY[0];
    const oven = setup.capacities[OVEN];
    return (
      <>
        <Segmented
          label="Oven"
          options={MULTIPLIERS}
          value={MULTIPLIERS.find((m) => ovenAt(m.value) === oven)?.value ?? -1}
          onChange={(m) => update({ capacities: { ...setup.capacities, [OVEN]: ovenAt(m) }, selected: OVEN })}
        />
        <Slider
          label={`${station.name} capacity`}
          unit="per hour"
          value={setup.capacities[station.id]}
          min={5}
          max={80}
          onChange={(v) => update({ capacities: { ...setup.capacities, [station.id]: v } })}
        />
      </>
    );
  }
  return undefined;
}

interface PlaybackProps {
  tick: number;
  hours: number;
  playing: boolean;
  speed: Speed;
  toggle: () => void;
  setSpeed: (speed: Speed) => void;
  onReset: () => void;
}

function Playback({ tick, hours, playing, speed, toggle, setSpeed, onReset }: PlaybackProps) {
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
      <div className="ml-1 hidden w-28 items-center gap-1.5 sm:flex">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full origin-left rounded-full bg-accent"
            initial={false}
            animate={{ scaleX: (tick + 1) / hours }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <span className="w-9 text-right text-[11px] tabular-nums text-muted">h {tick + 1}</span>
      </div>
    </div>
  );
}
