import type { LineConfig, Station } from "@/lib/line-sim";

/** Work items each column finishes per day. */
export const BOARD: Station[] = [
  { id: "analyse", name: "Analyse", capacity: 3 },
  { id: "build", name: "Build", capacity: 2 },
  { id: "test", name: "Test", capacity: 3 },
  { id: "deploy", name: "Deploy", capacity: 4 },
];

/** New requests per day. */
export const REQUESTS = 4;
export const DAYS = 60;
export const MAX_LIMIT = 12;
/** The limit the lesson sets once it stops pushing. */
export const LIMIT = 3;
/** Share of each column's daily capacity that noise can add or remove. */
export const VARIABILITY = 0.5;
export const OUTAGE_DAYS = 5;
/** The outage the lesson copy describes: Test down on days 20 to 24. */
export const OUTAGE: NonNullable<LineConfig["outage"]> = { station: "test", from: 20, to: 20 + OUTAGE_DAYS };
