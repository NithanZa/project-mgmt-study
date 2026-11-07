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
import { makespan, orderPriority, ruleComparator, serialSgs, serialSgsTrace, usage } from "@/engine/rcpsp/sgs";
import { RULES, type Capacities, type Placement, type Rule, type Schedule } from "@/engine/rcpsp/types";
import { Distribution } from "./distribution";
import { GanttRows } from "./gantt";
import { LaneRows } from "./lanes";
import { RANK_HEADER, RULE_LABEL, rankValues } from "./rules";
import { AXIS_DAYS } from "./timeline";

const SAMPLES = 40;
const STEP_MS = 40;
/** Seed whose 40 samples miss the optimum, so the full search visibly beats sampling. */
const SEED = 143;
const CPM = cpm(GAME_JAM);
const TASKS = GAME_JAM.length;
/** Beats: the Place-next stepper, and the beats that show the rank column. */
const STEP_BEAT = 1;
const RANK_BEATS = [1, 2, 4];
const NAME = new Map(GAME_JAM.map((t) => [t.id, t.name]));
const placedOf = (n: number) => `${Math.round(n)} of ${TASKS}`;

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
  /** Tasks placed by the stepper; it reopens at 0 whenever the beat changes. */
  const [stepper, setStepper] = useState({ beat, placed: 0 });
  const [, startTransition] = useTransition();

  const capacities = beat === 4 ? state.capacities : CAPACITIES;
  const mode = beat === 0 ? "cpm" : beat <= 2 ? "rule" : state.mode;
  const rule: Rule = beat === 1 ? "min-lst" : state.rule;
  const sample = step !== null && beat >= 3 ? step : null;
  if (stepper.beat !== beat) setStepper({ beat, placed: 0 });
  const stepping = beat === STEP_BEAT;
  const placedCount = stepping && stepper.beat === beat ? stepper.placed : 0;
  const place = (placed: number) => setStepper({ beat, placed });

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
  const trace = useMemo(() => serialSgsTrace(GAME_JAM, capacities, rule), [capacities, rule]);
  const ranks = useMemo(() => rankValues(rule, GAME_JAM), [rule]);
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

  // While stepping, placed tasks sit where the generator put them; the rest wait as
  // outlines at their CPM spot and use no people.
  const partial = trace.placed[placedCount];
  const placedAt = new Map(partial.map((p) => [p.id, p]));
  const pending = new Set(stepping ? trace.order.slice(placedCount) : []);
  const lastPlaced: Placement | undefined = placedAt.get(trace.order[placedCount - 1]);
  const schedule: Schedule = stepping
    ? GAME_JAM.map((t, i) => placedAt.get(t.id) ?? CPM.schedule[i])
    : sample !== null
      ? samples[sample].schedule
      : mode === "cpm"
        ? CPM.schedule
        : mode === "optimum"
          ? optimum
          : (ruleSchedules.get(rule) ?? CPM.schedule);
  const days = makespan(stepping ? partial : schedule);
  const working = stepping
    ? GAME_JAM.map((t) => placedAt.get(t.id) ?? { id: t.id, start: 0, finish: 0 })
    : schedule;
  const profile = usage(GAME_JAM, working, AXIS_DAYS);
  const bestSoFar =
    sample !== null
      ? bestByStep[sample]
      : mode === "optimum"
        ? search.best.makespan
        : null;
  const evaluated = sample !== null ? sample + 1 : mode === "optimum" ? search.evaluated : 0;
  // The stepper's rule dot appears once its last task lands.
  const marked: readonly Rule[] =
    beat === 0 || (stepping && placedCount < TASKS) ? [] : stepping ? ["min-lst"] : RULES;
  const ruleMarks = marked.map((r) => ({ rule: r, days: makespan(ruleSchedules.get(r) ?? []) }));
  const markDays = ruleMarks.map((m) => m.days);
  const ruleRange =
    ruleMarks.length > 1
      ? ` The ${ruleMarks.length} rules range from ${Math.min(...markDays)} to ${Math.max(...markDays)} days.`
      : "";

  const team = `${capacities.programmer} programmers and ${capacities.artist} ${capacities.artist === 1 ? "artist" : "artists"}`;
  const label = stepping
    ? `Placing tasks latest start first (Min LST) with ${team}: placed ${placedOf(placedCount)}` +
      (lastPlaced ? `, last ${NAME.get(lastPlaced.id)} on days ${lastPlaced.start} to ${lastPlaced.finish}` : "") +
      `; placed work ends on day ${days}.${ruleRange}`
    : mode === "cpm"
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
    beat === STEP_BEAT ? (
      <>
        <Button variant="primary" disabled={placedCount >= TASKS} onClick={() => place(placedCount + 1)}>
          Place next task
        </Button>
        <Button disabled={placedCount >= TASKS} onClick={() => place(TASKS)}>
          Place all
        </Button>
        <Button disabled={placedCount === 0} onClick={() => place(0)}>
          Reset
        </Button>
      </>
    ) : beat === 2 ? (
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
          {stepping && <Readout label="Placed" value={placedCount} format={placedOf} />}
          {beat >= 3 && <Readout label="Orders evaluated" value={evaluated} />}
        </>
      }
      controls={controls}
    >
      <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
        <div className="grid min-h-0 flex-[3] grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_repeat(7,minmax(0,1fr))_auto_repeat(2,minmax(0,1.4fr))] gap-x-2 text-[10px] sm:text-xs">
          <GanttRows
            tasks={GAME_JAM}
            schedule={schedule}
            span={days}
            pending={pending}
            rank={
              RANK_BEATS.includes(beat)
                ? { header: RANK_HEADER[rule], values: ranks, first: trace.order[0] }
                : null
            }
          />
          <LaneRows profile={profile} capacities={capacities} firstRow={TASKS + 3} />
        </div>
        <div className="min-h-0 flex-[1.3]">
          <Distribution
            lowerBound={CPM.duration}
            histogram={mode === "optimum" && sample === null ? search.histogram : null}
            rules={ruleMarks}
            selected={mode === "rule" ? rule : null}
            best={bestSoFar}
            target={beat >= 3 ? search.best.makespan : null}
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
