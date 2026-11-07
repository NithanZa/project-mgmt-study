"use client";

import { motion } from "motion/react";
import { useSpot, useSpotlight } from "@/components/lesson/spotlight";
import { Legend } from "@/components/ui/legend";
import { cfdGapsAt, WINDOW } from "@/engine/kanban/flow";
import { cycleTimeFromLittle } from "@/engine/kanban/littles";
import type { LineResult, Station } from "@/lib/line-sim";
import { useSize } from "./use-size";

const BANDS = ["fill-accent/15", "fill-accent/35", "fill-accent/55", "fill-accent/80"];
const SWATCHES = ["bg-accent/15", "bg-accent/35", "bg-accent/55", "bg-accent/80"];
/** The top margin leaves room for the "arrived" label above the last day's arrivals. */
const M = { left: 26, right: 84, top: 14, bottom: 16 };
const FADE = { duration: 0.18, ease: "easeOut" } as const;

export interface CfdProps {
  stations: Station[];
  result: LineResult;
  tick: number;
  /** Items finished per day, as the throughput readout shows it. */
  throughput: number;
  interval: number;
  /** Draw the WIP and cycle-time brackets and Little's law under the chart. */
  showGaps: boolean;
}

const one = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

export function Cfd({ stations, result, tick, throughput, interval, showGaps }: CfdProps) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const bandSpot = useSpot("band");
  const arrivalsSpot = useSpot("arrivals");
  const doneSpot = useSpot("done");
  const wipSpot = useSpot("wip");
  const cycleSpot = useSpot("cycle-time");
  const throughputSpot = useSpot("throughput");
  const slopeShown = useSpotlight() === "throughput";
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
  // End labels: with the WIP label between them, "arrived" and "done" keep a line's
  // clearance from it even when the bands are thin (a short plot on a phone).
  const yWip = (yIn + yOut) / 2 + 1;
  const yArrived = Math.max(showGaps ? Math.min(yIn - 9, yWip - 12) : yIn - 9, 8);
  const yDone = showGaps ? Math.max(yOut + 9, yWip + 12) : Math.min(yOut + 9, M.top + h);
  const xa = gaps.arrivedTick === null ? xt : x(gaps.arrivedTick);
  const cycleTime = gaps.arrivedTick === null ? 0 : tick - gaps.arrivedTick;
  // The throughput readout's window: work finished over the last WINDOW days is the done line's slope.
  const from = Math.max(0, tick - WINDOW);
  const morph = { duration: interval / 1000, ease: "linear" } as const;
  const ready = width > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div ref={ref} className="relative min-h-0 flex-1">
        {ready && (
          <svg width={width} height={height} className="absolute inset-0" aria-hidden>
            {stations.map((s, i) => (
              <motion.path
                key={s.id}
                {...bandSpot}
                data-band={s.id}
                className={BANDS[i]}
                initial={false}
                animate={{ d: band(i) }}
                transition={morph}
              />
            ))}
            <motion.path
              {...arrivalsSpot}
              className="fill-none stroke-accent"
              strokeWidth={1.5}
              initial={false}
              animate={{ d: `M ${line(0)}` }}
              transition={morph}
            />
            <motion.path
              {...doneSpot}
              className="fill-none stroke-fg"
              strokeWidth={2}
              initial={false}
              animate={{ d: `M ${line(stations.length)}` }}
              transition={morph}
            />
            {slopeShown && (
              <path
                {...throughputSpot}
                data-slope
                d={`M ${x(from)},${y(result.ticks[from].exited)} L ${xt},${yOut}`}
                className="fill-none stroke-constraint"
                strokeWidth={4}
                strokeLinecap="round"
              />
            )}
            <path d={`M ${M.left},${M.top + h} H ${M.left + w}`} className="stroke-line" />
            <text x={M.left - 4} y={M.top + 8} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {top}
            </text>
            <text x={M.left + 4} y={M.top + 8} className="fill-muted text-[10px]">
              items
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

            <motion.g {...arrivalsSpot} initial={false} animate={{ x: xt + 7, y: yArrived }} transition={morph}>
              <text data-end="arrived" dy="0.35em" className="fill-accent text-[10px] font-semibold">
                arrived
              </text>
            </motion.g>
            <motion.g
              {...doneSpot}
              initial={false}
              animate={{ x: xt + 7, y: yDone }}
              transition={morph}
            >
              <text data-end="done" dy="0.35em" className="fill-fg text-[10px] font-semibold">
                done
              </text>
            </motion.g>

            {/* The group fades inline, which would beat the spotlight, so its children carry the tags. */}
            <motion.g initial={false} animate={{ opacity: showGaps ? 1 : 0 }} transition={FADE} data-gaps={showGaps}>
              <motion.path
                {...wipSpot}
                data-bracket="wip"
                className="fill-none stroke-constraint"
                strokeWidth={2}
                initial={false}
                animate={{ d: `M ${xt - 4},${yIn} H ${xt + 4} M ${xt},${yIn} V ${yOut} M ${xt - 4},${yOut} H ${xt + 4}` }}
                transition={morph}
              />
              <motion.g {...wipSpot} initial={false} animate={{ x: xt + 7, y: yWip }} transition={morph}>
                <text data-wip={gaps.wip} dy="0.35em" className="fill-constraint text-[11px] font-semibold tabular-nums">
                  WIP {gaps.wip}
                </text>
              </motion.g>

              {gaps.arrivedTick !== null && (
                <>
                  <motion.path
                    {...cycleSpot}
                    data-bracket="cycle"
                    className="fill-none stroke-fg"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    initial={false}
                    animate={{
                      d: `M ${xa},${yOut - 4} V ${yOut + 4} M ${xa},${yOut} H ${xt} M ${xt},${yOut - 4} V ${yOut + 4}`,
                    }}
                    transition={morph}
                  />
                  <motion.g {...cycleSpot} initial={false} animate={{ x: xt + 7, y: Math.max(yOut + 23, yDone + 14) }} transition={morph}>
                    <text data-cycle={cycleTime} dy="0.35em" className="fill-fg text-[11px] font-semibold tabular-nums">
                      cycle time {cycleTime}d
                    </text>
                  </motion.g>
                </>
              )}
            </motion.g>
          </svg>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Legend items={stations.map((s, i) => ({ label: s.name, swatch: SWATCHES[i] }))} />
        {/* Fades inline, so its numbers carry the tags. */}
        <motion.p
          data-formula
          aria-hidden={!showGaps}
          className="text-xs tabular-nums sm:text-sm"
          initial={false}
          animate={{ opacity: showGaps ? 1 : 0 }}
          transition={FADE}
        >
          <span className="text-muted">WIP</span>{" "}
          <b {...wipSpot} className="text-constraint">
            {gaps.wip}
          </b>
          <span className="text-muted"> ÷ throughput </span>
          <b {...throughputSpot}>{one(throughput)}</b>
          <span className="text-muted"> = cycle time </span>
          <b {...cycleSpot}>{one(cycleTimeFromLittle(gaps.wip, throughput))}</b>
          <span className="text-muted"> days</span>
        </motion.p>
      </div>
    </div>
  );
}
