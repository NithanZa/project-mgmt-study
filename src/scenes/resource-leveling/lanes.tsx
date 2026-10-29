"use client";

import { motion } from "motion/react";
import type { Demand } from "@/engine/resource-leveling/profile";
import { RESOURCES, type Capacities, type Resource } from "@/engine/resource-leveling/types";
import { AXIS_DAYS, LANE_UNITS, type Geometry } from "./geometry";

const LABEL: Record<Resource, string> = { designer: "Designer", developer: "Developer" };
const BLOCK_CLASS: Record<Resource, string> = { designer: "fill-accent/55", developer: "fill-float/55" };
const FADE = { duration: 0.18, ease: "easeOut" } as const;
const DAYS = Array.from({ length: AXIS_DAYS }, (_, d) => d);
const UNITS = Array.from({ length: LANE_UNITS }, (_, k) => k);

export interface LanesProps {
  load: Demand;
  capacities: Capacities;
  geo: Geometry;
  /** Id of the SVG hatch pattern used for overloaded person-days. */
  hatch: string;
}

/** One block per person-day; blocks above the capacity line are hatched. */
export function Lanes({ load, capacities, geo, hatch }: LanesProps) {
  const { x0, dayW, font, plotRight } = geo;
  return (
    <g aria-hidden>
      {RESOURCES.map((r) => {
        const lane = geo.lanes[r];
        const cap = capacities[r];
        return (
          <g key={r}>
            <text
              x={x0 - font * 0.6}
              y={lane.top + (lane.bottom - lane.top) / 2}
              textAnchor="end"
              dominantBaseline="central"
              className="fill-fg font-medium"
              style={{ fontSize: font }}
            >
              {LABEL[r]}
            </text>
            <rect
              x={x0}
              y={lane.top}
              width={plotRight - x0}
              height={lane.bottom - lane.top}
              rx={3}
              className="fill-surface-2"
            />
            {DAYS.map((d) =>
              UNITS.map((k) => {
                const units = load[r][d] ?? 0;
                const over = k >= cap;
                return (
                  <motion.rect
                    key={`${d}-${k}`}
                    x={x0 + d * dayW + 1.5}
                    y={lane.bottom - (k + 1) * lane.unit + 1}
                    width={dayW - 3}
                    height={lane.unit - 2}
                    rx={2}
                    data-overload={over && k < units ? `${r}-${d}` : undefined}
                    fill={over ? `url(#${hatch})` : undefined}
                    strokeWidth={over ? 1.25 : 0}
                    className={over ? "stroke-constraint" : BLOCK_CLASS[r]}
                    initial={false}
                    animate={{ opacity: k < units ? 1 : 0 }}
                    transition={FADE}
                  />
                );
              }),
            )}
            <motion.g initial={false} animate={{ y: lane.bottom - cap * lane.unit }}>
              <line x1={x0} x2={plotRight} strokeWidth={1.5} className="stroke-fg" />
              <text
                x={plotRight + 3}
                dominantBaseline="central"
                className="fill-fg tabular-nums"
                style={{ fontSize: font * 0.9 }}
              >
                {cap}
              </text>
            </motion.g>
          </g>
        );
      })}
    </g>
  );
}
