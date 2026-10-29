import { mulberry32 } from "./random";

export interface Station {
  id: string;
  name: string;
  capacity: number;
}

export interface LineConfig {
  stations: Station[];
  arrivalsPerTick: number;
  ticks: number;
  seed: number;
  /** "drum": release only enough to hold `bufferTarget` items at or before the constraint. */
  release: "push" | "drum";
  bufferTarget?: number;
  /** Per-station pull limit, counting the items in work. */
  wipLimit?: number;
  /** 0..1, scales the uniform per-tick capacity noise. */
  variability: number;
  /** The station processes nothing for `from <= tick < to`. */
  outage?: { station: string; from: number; to: number };
  /** Capacity multiplier per station id, default 1. */
  efficiency?: Record<string, number>;
}

export interface TickState {
  tick: number;
  /** Items at each station at the end of the tick, including the one in work. */
  queues: number[];
  wip: number;
  /** Cumulative items that left the last station. */
  exited: number;
  released: number;
  processed: number[];
  /** Capacity each station had this tick after noise, efficiency and outage. */
  caps: number[];
}

export interface LineItem {
  id: number;
  enteredTick: number;
  exitedTick?: number;
  /** Tick the item joined each station's queue; `history[0] === enteredTick`. */
  history: number[];
}

export interface LineResult {
  ticks: TickState[];
  throughput: number;
  avgCycleTime: number;
  avgWip: number;
  utilization: number[];
  /** Id of the station with the smallest effective capacity, or "market" when demand is below it. */
  constraint: string;
  cfd: { tick: number; cumulativeIn: number; cumulativeOut: number[] }[];
  items: LineItem[];
}

export const MARKET = "market";
const MAX_ITEMS = 5000;

export function drumIndex(stations: Station[]): number {
  return stations.reduce((best, s, i) => (s.capacity < stations[best].capacity ? i : best), 0);
}

export function simulateLine(config: LineConfig): LineResult {
  const { stations, arrivalsPerTick, ticks, variability, wipLimit, outage } = config;
  const n = stations.length;
  const rng = mulberry32(config.seed);
  const effective = stations.map((s) => s.capacity * (config.efficiency?.[s.id] ?? 1));
  const outageAt = outage ? stations.findIndex((s) => s.id === outage.station) : -1;
  const drum = drumIndex(stations);
  const warmup = Math.min(10, ticks / 6);

  const queues: number[][] = stations.map(() => []);
  const entered: number[] = [];
  const items: LineItem[] = [];
  const processedTotal = new Array<number>(n).fill(0);
  const tickStates: TickState[] = [];
  const cfd: LineResult["cfd"] = [];
  let exited = 0;
  let measuredTicks = 0;
  let measuredExits = 0;
  let wipSum = 0;
  let cycleSum = 0;

  for (let tick = 0; tick < ticks; tick++) {
    const measured = tick >= warmup;
    const caps = new Array<number>(n).fill(0);
    const processed = new Array<number>(n).fill(0);
    // Downstream first, so nothing an upstream station finishes this tick is reprocessed this tick.
    // The noise draw happens in the same order, for every station, even at variability 0.
    for (let i = n - 1; i >= 0; i--) {
      const u = (rng() * 2 - 1) * variability;
      const down = i === outageAt && outage && tick >= outage.from && tick < outage.to;
      caps[i] = down ? 0 : Math.max(0, Math.round(effective[i] * (1 + u)));
      const last = i === n - 1;
      const room = wipLimit !== undefined && !last ? Math.max(0, wipLimit - queues[i + 1].length) : Infinity;
      const moved = queues[i].splice(0, Math.min(caps[i], queues[i].length, room));
      processed[i] = moved.length;
      processedTotal[i] += moved.length;
      for (const id of moved) {
        if (last) {
          exited++;
          if (measured) cycleSum += tick - entered[id];
          if (id < MAX_ITEMS) items[id].exitedTick = tick;
        } else {
          queues[i + 1].push(id);
          if (id < MAX_ITEMS) items[id].history.push(tick);
        }
      }
    }
    if (measured) measuredExits += processed[n - 1];

    let released = arrivalsPerTick;
    if (wipLimit !== undefined) released = Math.min(released, Math.max(0, wipLimit - queues[0].length));
    if (config.release === "drum") {
      const upstream = queues.slice(0, drum + 1).reduce((sum, q) => sum + q.length, 0);
      released = Math.min(released, Math.max(0, (config.bufferTarget ?? 0) - upstream));
    }
    for (let k = 0; k < released; k++) {
      const id = entered.length;
      entered.push(tick);
      queues[0].push(id);
      if (id < MAX_ITEMS) items.push({ id, enteredTick: tick, history: [tick] });
    }

    const lengths = queues.map((q) => q.length);
    const wip = lengths.reduce((a, b) => a + b, 0);
    if (measured) {
      measuredTicks++;
      wipSum += wip;
    }
    tickStates.push({ tick, queues: lengths, wip, exited, released, processed, caps });
    cfd.push({ tick, cumulativeIn: entered.length, cumulativeOut: [...processedTotal] });
  }

  const slowest = drumIndex(stations.map((s, i) => ({ ...s, capacity: effective[i] })));
  return {
    ticks: tickStates,
    throughput: measuredExits / measuredTicks,
    avgCycleTime: measuredExits ? cycleSum / measuredExits : 0,
    avgWip: wipSum / measuredTicks,
    utilization: processedTotal.map((p, i) => p / (stations[i].capacity * ticks)),
    constraint: arrivalsPerTick < effective[slowest] ? MARKET : stations[slowest].id,
    cfd,
    items,
  };
}
