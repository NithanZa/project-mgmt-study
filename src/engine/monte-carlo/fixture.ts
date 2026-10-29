import type { Estimate, Stream } from "./types";

export const MAX_STREAMS = 6;
export const STREAM_NAMES = ["Venue", "Speakers", "Marketing", "Sponsors", "Catering", "Travel"];
export const SHORTLIST: Estimate = { o: 3, m: 5, p: 9 };
export const CONFIRM: Estimate = { o: 2, m: 4, p: 8 };
export const RUSH_CONFIRM: Estimate = { o: 3, m: 6, p: 12 };
export const PREP: Estimate = { o: 1, m: 2, p: 3 };
export const SPEAKERS = 1;

export function streamsFor(k: number, rush = false): Stream[] {
  return STREAM_NAMES.slice(0, k).map((name, i) => ({
    id: name.toLowerCase(),
    name,
    shortlist: SHORTLIST,
    confirm: rush && i === SPEAKERS ? RUSH_CONFIRM : CONFIRM,
  }));
}
