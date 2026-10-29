import { simulateLine, type LineConfig } from "@/lib/line-sim";
import { BAKERY, CLEANING_LOSS, DEMAND, HOURS, OVEN } from "./fixture";

export const baseline = (): LineConfig => ({
  stations: BAKERY,
  arrivalsPerTick: DEMAND,
  ticks: HOURS,
  seed: 1,
  release: "push",
  variability: 0,
});

export const capacityOf = (config: LineConfig, stationId: string): number =>
  config.stations.find((s) => s.id === stationId)?.capacity ?? 0;

export const withCapacity = (config: LineConfig, stationId: string, capacity: number): LineConfig => ({
  ...config,
  stations: config.stations.map((s) => (s.id === stationId ? { ...s, capacity } : s)),
});

/** Whole loaves only: an oven at 25 per hour elevated by 1.5 bakes 37. */
export const elevate = (config: LineConfig, stationId: string, factor: number): LineConfig =>
  withCapacity(config, stationId, Math.floor(capacityOf(config, stationId) * factor));

export const invest = (config: LineConfig, stationId: string): LineConfig =>
  elevate(config, stationId, 1.5);

/** Release at the oven's pace, keeping three hours of oven work in the line before it. */
export const subordinate = (config: LineConfig): LineConfig => ({
  ...config,
  release: "drum",
  bufferTarget: 3 * capacityOf(config, OVEN),
});

export const exploitLoss = (config: LineConfig, on: boolean): LineConfig => ({
  ...config,
  efficiency: on ? { [OVEN]: 1 - CLEANING_LOSS } : undefined,
});

/** Throughput change from a +50% investment in each station, keyed by station id. */
export function investDeltas(config: LineConfig = baseline()): Record<string, number> {
  const base = simulateLine(config).throughput;
  return Object.fromEntries(
    config.stations.map((s) => [s.id, simulateLine(invest(config, s.id)).throughput - base]),
  );
}
