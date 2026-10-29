"use client";

import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react";
import type { SceneProps } from "@/content/types";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { cpm } from "@/engine/rcpsp/cpm";
import { CAPACITIES, GAME_JAM } from "@/engine/rcpsp/fixture";
import { exhaustive, sampleOrders } from "@/engine/rcpsp/search";
import { makespan, orderPriority, ruleComparator, serialSgs, usage } from "@/engine/rcpsp/sgs";
import { RULES, type Capacities, type Rule, type Schedule } from "@/engine/rcpsp/types";
import { Distribution } from "./distribution";
import { GanttRows } from "./gantt";
import { LaneRows } from "./lanes";
import { RULE_LABEL } from "./rules";
import { AXIS_DAYS } from "./timeline";

const SAMPLES = 40;
const STEP_MS = 40;
/** Seed whose 40 samples miss the optimum, so the full search visibly beats sampling. */
const SEED = 143;
const CPM = cpm(GAME_JAM);

const RULE_OPTIONS = RULES.map((value) => ({ value, label: RULE_LABEL[value] }));
const PROGRAMMER_OPTIONS = [2, 3].map((value) => ({ value, label: String(value) }));
const ARTIST_OPTIONS = [1, 2].map((value) => ({ value, label: String(value) }));

interface State {
  mode: "rule" | "optimum";
  rule: Rule;
  capacities: Capacities;
}

const INITIAL: State = { mode: "rule", rule: "min-lst", capacities: CAPACITIES };

export function RcpspScene({ beat }: SceneProps) {
  const [state, setState] = useState(INITIAL);
  const [step, setStep] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const capacities = beat === 4 ? state.capacities : CAPACITIES;
  const mode = beat === 0 ? "cpm" : beat <= 2 ? "rule" : state.mode;
  const rule: Rule = beat === 1 ? "min-lst" : state.rule;
  const sample = step !== null && beat >= 3 ? step : null;

  const ruleSchedules = useMemo(
    () => new Map(RULES.map((r) => [r, serialSgs(GAME_JAM, capacities, ruleComparator(r, GAME_JAM))])),
    [capacities],
  );
  const samples = useMemo(() => sampleOrders(GAME_JAM, capacities, SAMPLES, SEED), [capacities]);
  /** Best makespan among the first i + 1 samples, so playback steps only index. */
  const bestByStep = useMemo(
    () =>
      samples.reduce<number[]>((acc, s) => {
        acc.push(Math.min(acc.at(-1) ?? Infinity, s.makespan));
        return acc;
      }, []),
    [samples],
  );
  const search = useMemo(() => exhaustive(GAME_JAM, capacities), [capacities]);
  const optimum = useMemo(
    () => serialSgs(GAME_JAM, capacities, orderPriority(search.best.order)),
    [capacities, search],
  );

  useEffect(() => {
    if (step === null) return;
    const id = setTimeout(() => {
      if (step + 1 < SAMPLES) return setStep(step + 1);
      setStep(null);
      setState((s) => ({ ...s, mode: "optimum" }));
    }, STEP_MS);
    return () => clearTimeout(id);
  }, [step]);

  const schedule: Schedule =
    sample !== null
      ? samples[sample].schedule
      : mode === "cpm"
        ? CPM.schedule
        : mode === "optimum"
          ? optimum
          : (ruleSchedules.get(rule) ?? CPM.schedule);
  const days = makespan(schedule);
  const profile = usage(GAME_JAM, schedule, AXIS_DAYS);
  const bestSoFar =
    sample !== null
      ? bestByStep[sample]
      : mode === "optimum"
        ? search.best.makespan
        : null;
  const evaluated = sample !== null ? sample + 1 : mode === "optimum" ? search.evaluated : 0;
  const marked: readonly Rule[] = beat === 0 ? [] : beat === 1 ? ["min-lst"] : RULES;
  const ruleMarks = marked.map((r) => ({ rule: r, days: makespan(ruleSchedules.get(r) ?? []) }));
  const markDays = ruleMarks.map((m) => m.days);
  const ruleRange =
    ruleMarks.length > 1
      ? ` The ${ruleMarks.length} rules range from ${Math.min(...markDays)} to ${Math.max(...markDays)} days.`
      : "";

  const team = `${capacities.programmer} programmers and ${capacities.artist} ${capacities.artist === 1 ? "artist" : "artists"}`;
  const label =
    mode === "cpm"
      ? `Ignoring people: ${days} days; programmer demand peaks at ${Math.max(...profile.programmer)} against ${capacities.programmer}.`
      : sample !== null
        ? `Searching priority orders with ${team}: order ${sample + 1} of ${SAMPLES}, ${days} days, best so far ${bestSoFar} days.`
        : mode === "optimum"
          ? `Best of all ${search.evaluated} priority orders with ${team}: ${days} days; lower bound ${CPM.duration} days.`
          : `Priority rule ${RULE_LABEL[rule]} with ${team}: ${days} days.${ruleRange}`;

  const setRule = (r: Rule) => setState((s) => ({ ...s, mode: "rule", rule: r }));
  const setCapacity = (patch: Partial<Capacities>) =>
    startTransition(() => setState((s) => ({ ...s, capacities: { ...s.capacities, ...patch } })));
  const reset = () => {
    setStep(null);
    setState(INITIAL);
  };

  const ruleControl = <Segmented label="Priority rule" options={RULE_OPTIONS} value={rule} onChange={setRule} />;
  // aria-disabled rather than disabled while searching, so a keyboard user's focus stays put.
  const searchButton = (
    <Button
      variant="primary"
      aria-disabled={sample !== null}
      className="aria-disabled:pointer-events-none aria-disabled:opacity-40"
      onClick={() => sample === null && setStep(0)}
    >
      Search all orders
    </Button>
  );
  const resetButton = <Button onClick={reset}>Reset</Button>;
  const controls =
    beat === 2 ? (
      <Strip>
        {ruleControl}
        {resetButton}
      </Strip>
    ) : beat === 3 ? (
      <>
        {searchButton}
        {resetButton}
      </>
    ) : beat === 4 ? (
      <Strip>
        {ruleControl}
        <Segmented
          label="Programmers"
          options={PROGRAMMER_OPTIONS}
          value={state.capacities.programmer}
          onChange={(programmer) => setCapacity({ programmer })}
        />
        <Segmented
          label="Artists"
          options={ARTIST_OPTIONS}
          value={state.capacities.artist}
          onChange={(artist) => setCapacity({ artist })}
        />
        {searchButton}
        {resetButton}
      </Strip>
    ) : undefined;

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="Days" value={days} />
          {beat >= 3 && <Readout label="Orders evaluated" value={evaluated} />}
        </>
      }
      controls={controls}
    >
      <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
        <div className="grid min-h-0 flex-[3] grid-cols-[auto_minmax(0,1fr)] grid-rows-[repeat(7,minmax(0,1fr))_auto_repeat(2,minmax(0,1.4fr))] gap-x-2 text-[10px] sm:text-xs">
          <GanttRows tasks={GAME_JAM} schedule={schedule} span={days} />
          <LaneRows profile={profile} capacities={capacities} firstRow={GAME_JAM.length + 2} />
        </div>
        <div className="min-h-0 flex-[1.3]">
          <Distribution
            lowerBound={CPM.duration}
            histogram={mode === "optimum" && sample === null ? search.histogram : null}
            rules={ruleMarks}
            selected={mode === "rule" ? rule : null}
            best={bestSoFar}
          />
        </div>
      </div>
    </SceneFrame>
  );
}

/** One scrolling row of controls on phones, so the canvas keeps its height; wider panels wrap. */
function Strip({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-end gap-x-4 gap-y-3 overflow-x-auto pb-1 [contain:inline-size] *:shrink-0 sm:flex-wrap sm:pb-0 [&_button]:whitespace-nowrap">
      {children}
    </div>
  );
}
