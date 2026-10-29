"use client";

import { motion } from "motion/react";
import type { ConvergencePoint } from "@/engine/monte-carlo/types";
import { linear } from "./scale";
import { useSize } from "./use-size";

const MAJOR = [10, 100, 1000, 5000];
const NARROW = 300;
const PAD = { top: 26, right: 8, bottom: 24, left: 36 };

export interface ConvergenceBandProps {
  points: ConvergencePoint[];
  /** Run count to highlight; one of `points[i].runs`. */
  runs: number;
  /** This seed's P80 at `runs`. */
  estimate: number;
}

/** P80 estimate ±1 sd across seeds, against run count on a log axis. */
export function ConvergenceBand({ points, runs, estimate }: ConvergenceBandProps) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const lo = Math.min(...points.map((p) => p.p80 - p.sd), estimate);
  const hi = Math.max(...points.map((p) => p.p80 + p.sd), estimate);
  const x = linear(Math.log10(points[0].runs), Math.log10(points[points.length - 1].runs), PAD.left, width - PAD.right);
  const yTicks = [Math.floor(lo * 2) / 2, Math.ceil(hi * 2) / 2];
  const y = linear(yTicks[0], yTicks[1], height - PAD.bottom, PAD.top);
  const px = (r: number) => x(Math.log10(r));
  const upper = points.map((p) => `${px(p.runs)},${y(p.p80 + p.sd)}`);
  const lower = points.map((p) => `${px(p.runs)},${y(p.p80 - p.sd)}`).reverse();
  const centre = points.map((p) => `${px(p.runs)},${y(p.p80)}`).join(" L");
  const current = points.find((p) => p.runs === runs) ?? points[0];

  return (
    <div ref={ref} className="absolute inset-0">
      {width > 0 && (
        <svg width={width} height={height} className="text-[9px] lg:text-[11px]">
          <path d={`M${upper.join(" L")} L${lower.join(" L")} Z`} className="fill-accent-soft" />
          <path d={`M${centre}`} fill="none" strokeWidth={1.5} className="stroke-accent" />
          {points.map((p, i) => {
            const last = i === points.length - 1;
            if (width < NARROW && !MAJOR.includes(p.runs)) return null;
            return (
              <text key={p.runs} x={px(p.runs)} y={height - 4} textAnchor={last ? "end" : "middle"} className="fill-muted tabular-nums">
                {p.runs >= 1000 ? `${p.runs / 1000}k` : p.runs}
                {last && width >= NARROW && " runs"}
              </text>
            );
          })}
          {yTicks.map((t) => (
            <text key={t} x={PAD.left - 4} y={y(t) + 3} textAnchor="end" className="fill-muted tabular-nums">
              {t}
            </text>
          ))}
          <text x={PAD.left - 4} y={PAD.top - 12} textAnchor="end" className="fill-muted">
            P80 (d)
          </text>
          <motion.g initial={false} animate={{ x: px(current.runs) }}>
            <line y1={PAD.top} y2={height - PAD.bottom} strokeDasharray="2 3" className="stroke-muted" />
            <text
              x={px(current.runs) < width / 2 ? 6 : -6}
              y={PAD.top - 12}
              textAnchor={px(current.runs) < width / 2 ? "start" : "end"}
              className="fill-accent font-semibold tabular-nums"
            >
              ±{current.sd.toFixed(2)} d
            </text>
          </motion.g>
          <motion.path
            initial={false}
            animate={{ d: `M${px(current.runs)},${y(current.p80 + current.sd)} L${px(current.runs)},${y(current.p80 - current.sd)}` }}
            strokeWidth={4}
            strokeLinecap="round"
            className="stroke-accent"
          />
          <motion.circle
            initial={false}
            animate={{ x: px(runs), y: y(estimate) }}
            r={4}
            className="fill-surface stroke-accent"
            strokeWidth={2}
          />
        </svg>
      )}
    </div>
  );
}
