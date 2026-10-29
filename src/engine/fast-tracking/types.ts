export interface Phase {
  id: string;
  name: string;
  days: number;
}

/** Days each successor starts before its predecessor ends: Design→Foundations, Foundations→Framing, Framing→Interior. */
export type Overlaps = [number, number, number];
