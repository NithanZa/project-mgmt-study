import type { Station } from "@/lib/line-sim";

export const OVEN = "oven";

/** Capacity in loaves per hour. */
export const BAKERY: Station[] = [
  { id: "mix", name: "Mix", capacity: 60 },
  { id: "proof", name: "Proof", capacity: 40 },
  { id: OVEN, name: "Oven", capacity: 25 },
  { id: "cool", name: "Cool", capacity: 50 },
  { id: "pack", name: "Pack", capacity: 45 },
];

/** Orders per hour. */
export const DEMAND = 38;
export const HOURS = 80;
/** Share of oven time lost to cleaning in the exploit scenario. */
export const CLEANING_LOSS = 0.2;
