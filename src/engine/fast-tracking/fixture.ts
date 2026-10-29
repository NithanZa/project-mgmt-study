import type { Overlaps, Phase } from "./types";

export const HOUSE: Phase[] = [
  { id: "design", name: "Design", days: 20 },
  { id: "foundations", name: "Foundations", days: 15 },
  { id: "framing", name: "Framing", days: 20 },
  { id: "interior", name: "Interior", days: 25 },
];

/** An overlap stops one day short of the whole predecessor. */
export const MAX_OVERLAP: Overlaps = [19, 14, 19];
