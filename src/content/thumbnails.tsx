import type { ComponentType } from "react";
import { CrashingThumbnail } from "@/scenes/crashing/thumbnail";
import { CriticalChainThumbnail } from "@/scenes/critical-chain/thumbnail";
import { Thumbnail as CpmThumbnail } from "@/scenes/critical-path/thumbnail";
import { DbrThumbnail } from "@/scenes/dbr/thumbnail";
import { DsmThumbnail } from "@/scenes/dsm/thumbnail";
import { FastTrackingThumbnail } from "@/scenes/fast-tracking/thumbnail";
import { KanbanThumbnail } from "@/scenes/kanban/thumbnail";
import { Thumbnail as MonteCarloThumbnail } from "@/scenes/monte-carlo/thumbnail";
import { PertThumbnail } from "@/scenes/pert/thumbnail";
import { RcpspThumbnail } from "@/scenes/rcpsp/thumbnail";
import { ResourceLevelingThumbnail } from "@/scenes/resource-leveling/thumbnail";
import { TocThumbnail } from "@/scenes/toc/thumbnail";
import { VsmThumbnail } from "@/scenes/vsm/thumbnail";
import type { Slug } from "./types";

/** Static card art per lesson. Render on the server: some thumbnails run the engine. */
export const THUMBNAILS: Record<Slug, ComponentType> = {
  cpm: CpmThumbnail,
  pert: PertThumbnail,
  "monte-carlo": MonteCarloThumbnail,
  "fast-tracking": FastTrackingThumbnail,
  crashing: CrashingThumbnail,
  dsm: DsmThumbnail,
  "resource-leveling": ResourceLevelingThumbnail,
  rcpsp: RcpspThumbnail,
  "critical-chain": CriticalChainThumbnail,
  toc: TocThumbnail,
  dbr: DbrThumbnail,
  kanban: KanbanThumbnail,
  vsm: VsmThumbnail,
};
