"use client";

import { motion } from "motion/react";
import type { CpmResult } from "@/engine/critical-path/types";
import { TRANSITION } from "./motion";

const LABEL_W = 22;
const AXIS_H = 16;
const PAD_R = 14;
const MIN_WEEKS = 14;

export interface GanttStripProps {
  result: CpmResult;
  width: number;
  height: number;
}

const box = (x0: number, x1: number, y0: number, y1: number) =>
  `M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z`;

export function GanttStrip({ result, width, height }: GanttStripProps) {
  const span = Math.max(MIN_WEEKS, Math.ceil(result.duration / 2) * 2);
  const rowH = (height - AXIS_H) / result.order.length;
  const scale = (width - LABEL_W - PAD_R) / span;
  const at = (week: number) => LABEL_W + week * scale;
  const ticks = Array.from({ length: span / 2 + 1 }, (_, i) => i * 2);
  const small = rowH < 14;

  return (
    <svg width={width} height={height} aria-hidden className="block overflow-visible">
      {result.order.map((id, i) => {
        const row = result.rows[id];
        const y = i * rowH;
        const inset = row.critical ? rowH * 0.15 : rowH * 0.3;
        return (
          <g key={id}>
            {!small && (
              <text x={0} y={y + rowH / 2} dominantBaseline="central" className="fill-muted text-[10px]">
                {id}
              </text>
            )}
            <motion.path
              initial={false}
              animate={{ d: box(at(row.es), at(row.ef), y + inset, y + rowH - inset) }}
              transition={TRANSITION}
              className={`transition-colors ${row.critical ? "fill-accent" : "fill-muted"}`}
            />
            <motion.path
              initial={false}
              animate={{
                d: box(at(row.ef), at(row.lf), y + inset + 0.5, y + rowH - inset - 0.5),
                opacity: row.float > 0 ? 1 : 0,
              }}
              transition={TRANSITION}
              fill="none"
              strokeDasharray="3 2"
              className="stroke-float"
              data-float={row.float}
              data-task={id}
            />
          </g>
        );
      })}
      <motion.path
        initial={false}
        animate={{ d: `M ${at(result.duration)} 0 V ${height - AXIS_H}` }}
        transition={TRANSITION}
        strokeDasharray="2 3"
        className="stroke-accent"
      />
      <line x1={LABEL_W} x2={at(span)} y1={height - AXIS_H} y2={height - AXIS_H} className="stroke-line" />
      {ticks.map((week) => (
        <text
          key={week}
          x={at(week)}
          y={height - AXIS_H + 11}
          textAnchor={week === span ? "end" : "middle"}
          className="fill-muted text-[10px] tabular-nums"
        >
          {week === span ? `${week} wk` : week}
        </text>
      ))}
    </svg>
  );
}
