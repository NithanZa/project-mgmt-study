"use client";

import { motion } from "motion/react";
import type { SweepPoint } from "@/engine/kanban/sweep";
import { useSize } from "./use-size";

const M = { left: 30, right: 12, top: 16, bottom: 18, gap: 22 };
/** Below this height only the throughput panel is drawn, so it stays readable on a phone. */
const TWO_PANELS = 150;
const FADE = { duration: 0.18, ease: "easeOut" } as const;

export interface SweepChartProps {
  /** Without and with variability, one point per WIP limit. */
  steady: SweepPoint[];
  noisy: SweepPoint[];
  variability: boolean;
  limit: number;
}

interface Panel {
  key: "cycleTime" | "throughput";
  label: string;
  max: number;
  ticks: number[];
  format: (n: number) => string;
}

export function SweepChart({ steady, noisy, variability, limit }: SweepChartProps) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const points = variability ? noisy : steady;
  const n = points.length;
  const w = Math.max(0, width - M.left - M.right);
  const x = (l: number) => M.left + ((l - 1) / (n - 1)) * w;
  const maxCycle = Math.ceil(Math.max(...[...steady, ...noisy].map((q) => q.cycleTime)) / 2) * 2;
  const all: Panel[] = [
    { key: "cycleTime", label: "cycle time, days", max: maxCycle, ticks: [0, maxCycle / 2, maxCycle], format: String },
    { key: "throughput", label: "throughput / day", max: 2.5, ticks: [0, 1, 2], format: String },
  ];
  const panels = height < TWO_PANELS ? all.slice(1) : all;
  const ph = Math.max(0, (height - M.bottom - panels.length * M.top - (panels.length - 1) * M.gap) / panels.length);
  const selected = points[limit - 1];

  return (
    <div ref={ref} className="relative h-full min-h-0">
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          {panels.map((p, i) => {
            const y0 = M.top + i * (ph + M.gap + M.top);
            const y = (v: number) => y0 + ph - (v / p.max) * ph;
            const path = (pts: SweepPoint[]) => pts.map((q, k) => `${k ? "L" : "M"} ${x(q.limit)},${y(q[p.key])}`).join(" ");
            return (
              <g key={p.key} data-panel={p.key}>
                <text x={M.left} y={y0 - 5} className="fill-muted text-[10px] sm:text-[11px]">
                  {p.label}
                </text>
                {p.ticks.map((t) => (
                  <g key={t}>
                    <path d={`M ${M.left},${y(t)} H ${M.left + w}`} className="stroke-line" strokeDasharray={t ? "2 3" : undefined} />
                    <text x={M.left - 5} y={y(t)} dy="0.35em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
                      {p.format(t)}
                    </text>
                  </g>
                ))}
                <motion.path
                  d={path(steady)}
                  className="fill-none stroke-muted"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  initial={false}
                  animate={{ opacity: variability ? 1 : 0 }}
                  transition={FADE}
                />
                <motion.path
                  className="fill-none stroke-accent"
                  strokeWidth={2.5}
                  initial={false}
                  animate={{ d: path(points) }}
                />
                {points.map((q) => (
                  <motion.g
                    key={q.limit}
                    data-limit={q.limit}
                    data-value={q[p.key].toFixed(2)}
                    initial={false}
                    animate={{ x: x(q.limit), y: y(q[p.key]) }}
                  >
                    <circle r={q.limit === limit ? 5 : 3} className={q.limit === limit ? "fill-accent stroke-surface" : "fill-accent"} strokeWidth={2} />
                  </motion.g>
                ))}
                <motion.g initial={false} animate={{ x: x(limit), y: y(selected[p.key]) }}>
                  <text
                    data-selected={p.key}
                    y={-9}
                    textAnchor={limit > n - 2 ? "end" : limit < 2 ? "start" : "middle"}
                    className="fill-fg text-[11px] font-semibold tabular-nums"
                  >
                    {selected[p.key].toFixed(2)}
                  </text>
                </motion.g>
              </g>
            );
          })}
          <motion.path
            d={`M 0,${M.top} V ${height - M.bottom}`}
            className="stroke-accent/40"
            strokeWidth={1}
            initial={false}
            animate={{ x: x(limit) }}
          />
          <text x={2} y={height - 4} className="fill-muted text-[10px]">
            limit
          </text>
          {points.map((q) => (
            <text
              key={q.limit}
              x={x(q.limit)}
              y={height - 4}
              textAnchor="middle"
              className={`text-[10px] tabular-nums ${q.limit === limit ? "fill-fg font-semibold" : "fill-muted"}`}
            >
              {q.limit}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
