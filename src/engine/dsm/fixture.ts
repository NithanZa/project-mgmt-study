import type { Activity, Order } from "./types";

export const BIKE: Activity[] = [
  { id: "M", name: "Market requirements", deps: [] },
  { id: "C", name: "Concept", deps: ["M"] },
  { id: "I", name: "Industrial design", deps: ["C"] },
  { id: "E", name: "Engineering", deps: ["C", "I", "T"] },
  { id: "P", name: "Prototype", deps: ["E", "I"] },
  { id: "T", name: "Testing", deps: ["P"] },
  { id: "L", name: "Tooling", deps: ["E"] },
  { id: "R", name: "Release", deps: ["T", "L"] },
];

export const ALPHABETICAL: Order = BIKE.map((a) => a.id).sort();
