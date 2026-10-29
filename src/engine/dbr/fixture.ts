import type { Station } from "@/lib/line-sim";

export const WELD = "weld";

/** Capacity in items per day; welding is the drum. */
export const SHOP: Station[] = [
  { id: "cut", name: "Cut", capacity: 6 },
  { id: WELD, name: "Weld", capacity: 3 },
  { id: "paint", name: "Paint", capacity: 5 },
];

export const WELD_INDEX = SHOP.findIndex((s) => s.id === WELD);
/** Orders per day. */
export const ORDERS = 5;
export const DAYS = 60;
