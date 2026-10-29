import type { Capacities, Task } from "./types";

export const GAME_JAM: Task[] = [
  { id: "A", name: "Concept art", days: 5, deps: [], needs: { artist: 1 } },
  { id: "B", name: "Engine setup", days: 3, deps: [], needs: { programmer: 2 } },
  { id: "C", name: "Style guide", days: 2, deps: [], needs: { artist: 1 } },
  { id: "D", name: "Level 1", days: 5, deps: ["C"], needs: { programmer: 1, artist: 1 } },
  { id: "E", name: "Level 2", days: 4, deps: ["C", "D"], needs: { programmer: 1, artist: 1 } },
  { id: "F", name: "Multiplayer", days: 6, deps: ["B", "D"], needs: { programmer: 2 } },
  { id: "G", name: "Boss fight", days: 6, deps: ["D"], needs: { programmer: 1 } },
];

export const CAPACITIES: Capacities = { programmer: 2, artist: 1 };
