import type { LineConfig } from "@/lib/line-sim";
import { DAYS, ORDERS, SHOP } from "./fixture";

export const push = (): LineConfig => ({
  stations: SHOP,
  arrivalsPerTick: ORDERS,
  ticks: DAYS,
  seed: 1,
  release: "push",
  variability: 0,
});

/** Rope tied to the drum: release only enough to hold `bufferTarget` items at or before Weld. */
export const drum = (bufferTarget: number, variability: number, seed = 1): LineConfig => ({
  ...push(),
  release: "drum",
  bufferTarget,
  variability,
  seed,
});

/** Drum settings each lesson beat opens on. */
export interface DrumSetting {
  bufferTarget: number;
  variability: number;
}
export const ROPE: DrumSetting = { bufferTarget: 6, variability: 0 };
export const STARVED: DrumSetting = { bufferTarget: 6, variability: 1 };
export const INSURED: DrumSetting = { bufferTarget: 12, variability: 1 };
export const TRY_IT: DrumSetting = { bufferTarget: 6, variability: 0.5 };
