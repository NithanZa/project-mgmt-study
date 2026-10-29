"use client";

import { motion } from "motion/react";
import { Legend } from "@/components/ui/legend";
import { cfdGapsAt } from "@/engine/kanban/flow";
import { cycleTimeFromLittle } from "@/engine/kanban/littles";
import type { LineResult, Station } from "@/lib/line-sim";
import { useSize } from "./use-size";

const BANDS = ["fill-accent/15", "fill-accent/35", "fill-accent/55", "fill-accent/80"];
const SWATCHES = ["bg-accent/15", "bg-accent/35", "bg-accent/55", "bg-accent/80"];
const M = { left: 26, right: 84, top: 8, bottom: 16 };

export interface CfdProps {
  stations: Station[];
  result: LineResult;
  tick: number;
  /** Items finished per day, as the throughput readout shows it. */
  throughput: number;
  interval: number;
}

const one = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

export function Cfd({ stations, result, tick, throughput, interval }: CfdProps) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const days = result.cfd.length;
  const top = result.cfd[days - 1].cumulativeIn;
  const w = Math.max(0, width - M.left - M.right);
  const h = Math.max(0, height - M.top - M.bottom);
  const x = (day: number) => M.left + (day / (days - 1)) * w;
  const y = (count: number) => M.top + h - (count / top) * h;

  // Curve k is arrivals (k = 0) or departures from column k - 1; days after `tick` collapse onto `tick`.
  const curve = (k: number, day: number) => {
    const c = result.cfd[Math.min(day, tick)];
    return k === 0 ? c.cumulativeIn : c.cumulativeOut[k - 1];
  };
  const line = (k: number, reverse = false) => {
    const pts = Array.from({ length: days }, (_, d) => `${x(Math.min(d, tick)).toFixed(1)},${y(curve(k, d)).toFixed(1)}`);
    return (reverse ? pts.reverse() : pts).join(" L ");
  };
  const band = (k: number) => `M ${line(k)} L ${line(k + 1, true)} Z`;

  const gaps = cfdGapsAt(result, tick);
  const xt = x(tick);
  const yIn = y(result.cfd[tick].cumulativeIn);
  const yOut = y(result.ticks[tick].exited);
  const xa = gaps.arrivedTick === null ? xt : x(gaps.arrivedTick);
  const cycleTime = gaps.arrivedTick === null ? 0 : tick - gaps.arrivedTick;
  const morph = { duration: interval / 1000, ease: "linear" } as const;
  const ready = width > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div ref={ref} className="relative min-h-0 flex-1">
        {ready && (
          <svg width={width} height={height} className="absolute inset-0" aria-hidden>
            {stations.map((s, i) => (
              <motion.path key={s.id} className={BANDS[i]} initial={false} animate={{ d: band(i) }} transition={morph} />
            ))}
            <motion.path
              className="fill-none stroke-fg"
              strokeWidth={2}
              initial={false}
              animate={{ d: `M ${line(stations.length)}` }}
              transition={morph}
            />
            <path d={`M ${M.left},${M.top + h} H ${M.left + w}`} className="stroke-line" />
            <text x={M.left - 4} y={M.top + 8} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {top}
            </text>
            <text x={M.left - 4} y={M.top + h} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              0
            </text>
            <text x={M.left + w} y={height - 2} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              day {days}
            </text>
            <text x={M.left} y={height - 2} className="fill-muted text-[10px] tabular-nums">
              day 1
            </text>

            <motion.path
              data-bracket="wip"
              className="fill-none stroke-constraint"
              strokeWidth={2}
              initial={false}
              animate={{ d: `M ${xt - 4},${yIn} H ${xt + 4} M ${xt},${yIn} V ${yOut} M ${xt - 4},${yOut} H ${xt + 4}` }}
              transition={morph}
            />
            <motion.g initial={false} animate={{ x: xt + 7, y: (yIn + yOut) / 2 }} transition={morph}>
              <text data-wip={gaps.wip} dy="0.35em" className="fill-constraint text-[11px] font-semibold tabular-nums">
                WIP {gaps.wip}
              </text>
            </motion.g>

            {gaps.arrivedTick !== null && (
              <>
                <motion.path
                  data-bracket="cycle"
                  className="fill-none stroke-fg"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  initial={false}
                  animate={{ d: `M ${xa},${yOut - 4} V ${yOut + 4} M ${xa},${yOut} H ${xt} M ${xt},${yOut - 4} V ${yOut + 4}` }}
                  transition={morph}
                />
                <motion.g initial={false} animate={{ x: xt + 7, y: yOut + 14 }} transition={morph}>
                  <text data-cycle={cycleTime} dy="0.35em" className="fill-fg text-[11px] font-semibold tabular-nums">
                    cycle time {cycleTime}d
                  </text>
                </motion.g>
              </>
            )}
          </svg>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="hidden sm:block">
          <Legend items={stations.map((s, i) => ({ label: s.name, swatch: SWATCHES[i] }))} />
        </div>
        <p data-formula className="text-xs tabular-nums sm:text-sm">
          <span className="text-muted">WIP</span> <b className="text-constraint">{gaps.wip}</b>
          <span className="text-muted"> ÷ throughput </span>
          <b>{one(throughput)}</b>
          <span className="text-muted"> = cycle time </span>
          <b>{one(cycleTimeFromLittle(gaps.wip, throughput))}</b>
          <span className="text-muted"> days</span>
        </p>
      </div>
    </div>
  );
}
