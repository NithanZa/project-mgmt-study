import type { LineConfig, LineResult } from "@/lib/line-sim";

/** Days the live throughput and cycle-time readouts average over. */
const WINDOW = 10;

export interface Flow {
  /** Items on the board at the end of the day. */
  wip: number;
  /** Items finished per day over the last `WINDOW` days. */
  throughput: number;
  /** Mean days on the board of the items finished in the last `WINDOW` days; 0 before the first finishes. */
  cycleTime: number;
}

const finishedBy = (result: LineResult, tick: number) => (tick < 0 ? 0 : result.ticks[tick].exited);

/** Flow on the board at the end of day `tick`, as a team would measure it from its recent history. */
export function flowAt(result: LineResult, tick: number, window = WINDOW): Flow {
  const from = finishedBy(result, tick - window);
  const to = finishedBy(result, tick);
  let days = 0;
  // Columns are first in, first out, so the items finished in the window are a contiguous id range.
  for (let id = from; id < to; id++) days += (result.items[id].exitedTick ?? tick) - result.items[id].enteredTick;
  return {
    wip: result.ticks[tick].wip,
    throughput: (to - from) / Math.min(window, tick + 1),
    cycleTime: to > from ? days / (to - from) : 0,
  };
}

export interface CfdGaps {
  /** Vertical gap at `tick`: arrivals minus departures. */
  wip: number;
  /** Day the last finished item arrived; the horizontal gap runs from here to `tick`. Null before anything finishes. */
  arrivedTick: number | null;
}

/** The two gaps a cumulative flow diagram shows at the end of day `tick`. */
export function cfdGapsAt(result: LineResult, tick: number): CfdGaps {
  const done = result.ticks[tick].exited;
  return { wip: result.ticks[tick].wip, arrivedTick: done > 0 ? result.items[done - 1].enteredTick : null };
}

export interface Column {
  id: string;
  name: string;
  capacity: number;
  /** Id of the oldest item; the column holds ids `first` to `first + count - 1`. */
  first: number;
  count: number;
  full: boolean;
  /** Has work but cannot pass any of it on, because the next column is at its limit. */
  blocked: boolean;
  /** Out of action today. */
  down: boolean;
}

/** The board at the end of day `tick`. */
export function columnsAt(config: LineConfig, result: LineResult, tick: number): Column[] {
  const { queues, processed } = result.ticks[tick];
  const { cumulativeIn, cumulativeOut } = result.cfd[tick];
  const limit = config.wipLimit;
  const last = config.stations.length - 1;
  return config.stations.map((s, i) => {
    const down = config.outage?.station === s.id && tick >= config.outage.from && tick < config.outage.to;
    const entered = i === 0 ? cumulativeIn : cumulativeOut[i - 1];
    return {
      id: s.id,
      name: s.name,
      capacity: s.capacity,
      first: cumulativeOut[i],
      count: entered - cumulativeOut[i],
      full: limit !== undefined && queues[i] >= limit,
      blocked:
        limit !== undefined && i < last && !down && queues[i] > 0 && processed[i] === 0 && queues[i + 1] >= limit,
      down,
    };
  });
}
