import type { Capacities, Task } from "./types";

/** Three features: design, build and (for X and Y) review. Listed in dependency order. */
export const FEATURES: Task[] = [
  { id: "X1", name: "Design X", days: 3, deps: [], resource: "designer" },
  { id: "X2", name: "Build X", days: 4, deps: ["X1"], resource: "developer" },
  { id: "X3", name: "Review X", days: 1, deps: ["X2"], resource: "designer" },
  { id: "Y1", name: "Design Y", days: 2, deps: [], resource: "designer" },
  { id: "Y2", name: "Build Y", days: 3, deps: ["Y1"], resource: "developer" },
  { id: "Y3", name: "Review Y", days: 1, deps: ["Y2"], resource: "designer" },
  { id: "Z1", name: "Design Z", days: 2, deps: [], resource: "designer" },
  { id: "Z2", name: "Build Z", days: 2, deps: ["Z1"], resource: "developer" },
];

export const DEFAULT_CAPACITIES: Capacities = { designer: 1, developer: 2 };
