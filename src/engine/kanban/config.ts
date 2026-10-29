import type { LineConfig } from "@/lib/line-sim";
import { BOARD, DAYS, REQUESTS } from "./fixture";

/** Every request starts the day it arrives. */
export const push = (): LineConfig => ({
  stations: BOARD,
  arrivalsPerTick: REQUESTS,
  ticks: DAYS,
  seed: 1,
  release: "push",
  variability: 0,
});

/** A column pulls only while the next one holds fewer than `wipLimit` items; requests beyond the limit are turned away. */
export const limited = (wipLimit: number, variability = 0, outage?: LineConfig["outage"]): LineConfig => ({
  ...push(),
  wipLimit,
  variability,
  outage,
});
