import type { Task } from "./types";

export const COFFEE_SHOP: Task[] = [
  { id: "A", name: "Sign lease", weeks: 2, deps: [], pos: { col: 0, row: 1 } },
  { id: "B", name: "Permits", weeks: 4, deps: ["A"], pos: { col: 1, row: 0 } },
  { id: "C", name: "Renovation", weeks: 6, deps: ["A"], pos: { col: 1, row: 1 } },
  { id: "D", name: "Order equipment", weeks: 3, deps: ["A"], pos: { col: 1, row: 2 } },
  { id: "E", name: "Hire staff", weeks: 3, deps: ["B"], pos: { col: 2, row: 0 } },
  { id: "G", name: "Install equipment", weeks: 1, deps: ["C", "D"], pos: { col: 2, row: 2 } },
  { id: "F", name: "Train staff", weeks: 2, deps: ["E", "D"], pos: { col: 3, row: 0 } },
  { id: "H", name: "Soft opening", weeks: 1, deps: ["F", "G"], pos: { col: 4, row: 1 } },
];

export interface Preset {
  task: string;
  weeks: number;
}

/** The sandbox presets: Renovation 9, Order equipment 8, Permits 2. */
export const PRESETS: Preset[] = [
  { task: "C", weeks: 9 },
  { task: "D", weeks: 8 },
  { task: "B", weeks: 2 },
];
