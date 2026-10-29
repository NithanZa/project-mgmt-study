import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Slug } from "../types";

export const LESSON_COMPONENTS: Record<Slug, ComponentType> = {
  cpm: dynamic(() => import("./cpm")),
  pert: dynamic(() => import("./pert")),
  "monte-carlo": dynamic(() => import("./monte-carlo")),
  "fast-tracking": dynamic(() => import("./fast-tracking")),
  crashing: dynamic(() => import("./crashing")),
  dsm: dynamic(() => import("./dsm")),
  "resource-leveling": dynamic(() => import("./resource-leveling")),
  rcpsp: dynamic(() => import("./rcpsp")),
  "critical-chain": dynamic(() => import("./critical-chain")),
  toc: dynamic(() => import("./toc")),
  dbr: dynamic(() => import("./dbr")),
  kanban: dynamic(() => import("./kanban")),
  vsm: dynamic(() => import("./vsm")),
};
