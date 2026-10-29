"use client";

import { useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Slider } from "@/components/ui/slider";
import type { SceneProps } from "@/content/types";
import { schedule } from "@/engine/crashing/cpm";
import { crashCurve, crashOnce, optimum, shorten, spent, totalCostCurve } from "@/engine/crashing/crash";
import { BOOTH, DEFAULT_OVERHEAD, OVERHEAD_RANGE } from "@/engine/crashing/fixture";
import type { CrashTask } from "@/engine/crashing/types";
import { days, money } from "@/lib/format";
import { CostChart } from "./cost-chart";
import { Network } from "./network";

const CURVE = crashCurve(BOOTH);
/** Cheapest-first crashes already made when each beat opens. */
const PRESET = [0, 1, 2, 2, 2];
const TOTAL_FROM = 3;
const GRAPHICS = "C";

interface State {
  beat: number;
  history: CrashTask[][];
  overhead: number;
  /** Bumped to replay the flash on the latest crash; null when it should not show. */
  flash: number | null;
  flashes: number;
}

const top = (s: State) => s.history[s.history.length - 1];

function initial(beat: number, flashes: number, flash: boolean): State {
  const history = [BOOTH];
  for (let i = 0; i < PRESET[beat]; i++) history.push(crashOnce(history[history.length - 1])!.tasks);
  return { beat, history, overhead: DEFAULT_OVERHEAD, flash: flash ? flashes + 1 : null, flashes: flashes + 1 };
}

const push = (s: State, tasks: CrashTask[] | undefined): State =>
  tasks ? { ...s, history: [...s.history, tasks], flash: s.flashes + 1, flashes: s.flashes + 1 } : s;
const dayCount = (v: number) => days(v, 0);

export function CrashingScene({ beat }: SceneProps) {
  const [state, setState] = useState(() => initial(beat, 0, true));
  if (state.beat !== beat) {
    setState(initial(beat, state.flashes, PRESET[beat] !== state.history.length - 1));
  }

  const { history, overhead, flash } = state;
  const tasks = history[history.length - 1];
  const prev = history[history.length - 2];
  const { duration, paths } = useMemo(() => schedule(tasks), [tasks]);
  const next = useMemo(() => crashOnce(tasks), [tasks]);
  const points = useMemo(
    () => history.map((t) => ({ days: schedule(t).duration, direct: spent(BOOTH, t) })),
    [history],
  );
  const totals = useMemo(() => totalCostCurve(CURVE, overhead), [overhead]);
  const best = useMemo(() => optimum(CURVE, overhead), [overhead]);

  const direct = spent(BOOTH, tasks);
  const recent = prev ? tasks.filter((t, i) => t.days < prev[i].days) : [];
  const graphics = tasks.find((t) => t.id === GRAPHICS)!;
  const showTotal = beat >= TOTAL_FROM;

  const label =
    `Trade show booth network: ${days(duration)}, direct cost ${money(direct)}. ` +
    `Critical: ${paths.map((p) => p.join(" ")).join(" and ")}. ` +
    (recent.length ? `Last crashed: ${recent.map((t) => t.name).join(" and ")}. ` : "") +
    `With ${money(overhead)} per day overhead the cheapest total is ${money(best.total)} at ${days(best.days)}.`;

  const controls =
    beat > 0 ? (
      <>
        <Button
          variant="primary"
          disabled={!next}
          onClick={() => setState((s) => push(s, crashOnce(top(s))?.tasks))}
        >
          Crash a day{next ? ` · ${money(next.cost)}` : ""}
        </Button>
        <Button
          disabled={history.length < 2}
          onClick={() => setState((s) => ({ ...s, history: s.history.slice(0, -1), flash: null }))}
        >
          Undo
        </Button>
        <Button onClick={() => setState((s) => initial(s.beat, s.flashes, true))}>Reset</Button>
        {showTotal && (
          <Slider
            label="Overhead"
            unit="per day"
            value={overhead}
            {...OVERHEAD_RANGE}
            format={money}
            onChange={(v) => setState((s) => ({ ...s, overhead: v }))}
          />
        )}
        {beat === 4 && (
          <Button
            disabled={graphics.days === graphics.minDays}
            onClick={() => setState((s) => push(s, shorten(top(s), [GRAPHICS])))}
          >
            {/* Phones drop the verb so the button fits beside the slider; the name keeps it. */}
            <span className="max-sm:sr-only">Crash</span> {graphics.name} · {money(graphics.costPerDay)}
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <SceneFrame
      label={label}
      readouts={
        <>
          <Readout label="Days" value={duration} format={dayCount} />
          <Readout label="Direct cost" value={direct} format={money} />
          {showTotal && <Readout label="Total cost" value={direct + overhead * duration} format={money} />}
        </>
      }
      controls={controls}
    >
      <div data-canvas className="flex h-full flex-col gap-2">
        <div className={`min-h-0 flex-1 ${showTotal ? "max-lg:hidden" : ""}`}>
          <Network tasks={tasks} base={BOOTH} paths={paths} recent={recent.map((t) => t.id)} flash={flash} />
        </div>
        <div className={`min-h-0 flex-[1.3] ${showTotal ? "" : "max-lg:hidden"}`}>
          <CostChart points={points} totals={totals} best={best} showTotal={showTotal} />
        </div>
      </div>
    </SceneFrame>
  );
}
