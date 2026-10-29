import type { ResourceId, Task } from "./types";

export const REDESIGN: Task[] = [
  { id: "copy", name: "Copy", safe: 5, aggressive: 3, deps: [], resource: "writer" },
  { id: "design", name: "Design", safe: 8, aggressive: 5, deps: [], resource: "designer" },
  { id: "pages", name: "Pages", safe: 10, aggressive: 6, deps: ["design"], resource: "developer" },
  { id: "cms", name: "CMS", safe: 6, aggressive: 4, deps: ["copy"], resource: "developer" },
  {
    id: "integrate",
    name: "Integrate",
    safe: 4,
    aggressive: 2,
    deps: ["pages", "cms"],
    resource: "developer",
  },
  { id: "launch", name: "Launch", safe: 1, aggressive: 1, deps: ["integrate"], resource: "manager" },
];

export const CAPACITIES: Record<ResourceId, number> = {
  writer: 1,
  designer: 1,
  developer: 1,
  manager: 1,
};
