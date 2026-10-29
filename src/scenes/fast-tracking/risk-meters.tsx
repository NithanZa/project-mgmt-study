"use client";

import { motion } from "motion/react";
import { HOUSE } from "@/engine/fast-tracking/fixture";
import type { Edge } from "@/engine/fast-tracking/schedule";
import { pct } from "@/lib/format";
import { SPRING } from "./gantt";

/** One meter per overlap: chance of rework and expected rework days. */
export function RiskMeters({ edges, active }: { edges: Edge[]; active: number }) {
  return (
    <ul aria-hidden className="flex h-full flex-col justify-center gap-1.5 text-[10px] tabular-nums sm:gap-2.5 sm:text-xs">
      {edges.map((e, i) => (
        <li key={HOUSE[i + 1].id} className={`flex flex-col gap-0.5 ${i === active ? "text-fg" : "text-muted"}`}>
          <span className="flex justify-between gap-1 leading-none whitespace-nowrap">
            <span className={`min-w-0 truncate ${i === active ? "font-semibold" : ""}`}>{HOUSE[i + 1].name}</span>
            <span>
              {pct(e.risk)} · <span className="text-buffer">+{e.expectedRework.toFixed(1)}d</span>
            </span>
          </span>
          <span className={`relative overflow-hidden rounded-full bg-surface-2 ${i === active ? "h-2" : "h-1.5"}`}>
            <motion.span
              className="absolute inset-0 origin-left rounded-full bg-buffer"
              initial={false}
              animate={{ scaleX: e.risk }}
              transition={SPRING}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
