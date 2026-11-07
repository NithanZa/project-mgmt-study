"use client";

import { motion } from "motion/react";
import { useSpot } from "@/components/lesson/spotlight";
import type { SweepPoint } from "@/engine/dbr/sweep";

const LEFT = 36;
const RIGHT = 36;
/** Inset of the first and last buffer target from the axes, so tick labels clear the axis labels. */
const INSET = 8;
const CT_MAX = 8;
const X_TICKS = [3, 6, 9, 12, 15, 18];

export interface SweepChartProps {
  width: number;
  height: number;
  points: SweepPoint[];
  bufferTarget: number;
  /** Buffer target of the knee, ringed on the busy line. */
  knee?: number;
}

const path = (xy: [number, number][]) => xy.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const pct = (u: number) => `${Math.round(u * 100)}%`;
const oneDay = (d: number) => `${Math.round(d * 10) / 10} d`;

/** Drum utilisation and cycle time against the buffer target, means over eight seeds. */
export function SweepChart({ width, height, points, bufferTarget, knee }: SweepChartProps) {
  const busySpot = useSpot("busy-line");
  const cycleSpot = useSpot("cycle-line");
  const kneeSpot = useSpot("knee");
  const currentSpot = useSpot("current");
  const font = height < 160 ? 9.5 : 11;
  const top = font * 2.8;
  /** Room under the plot for the tick labels and the axis label. */
  const bottom = font * 2.4 + 6;
  const lo = points[0].bufferTarget;
  const hi = points[points.length - 1].bufferTarget;
  const sx = (b: number) => LEFT + INSET + ((b - lo) / (hi - lo)) * (width - LEFT - RIGHT - 2 * INSET);
  const sy = (fraction: number) => height - bottom - fraction * (height - top - bottom);
  const busy = path(points.map((p) => [sx(p.bufferTarget), sy(p.drumUtilization)]));
  const cycle = path(points.map((p) => [sx(p.bufferTarget), sy(p.cycleTime / CT_MAX)]));
  const current = points.find((p) => p.bufferTarget === bufferTarget) ?? points[0];
  const kneePoint = knee === undefined ? undefined : points.find((p) => p.bufferTarget === knee);
  const small = { fontSize: font };

  return (
    <svg width={width} height={height} className="block overflow-visible select-none" aria-hidden data-sweep>
      <g className="fill-muted tabular-nums" style={small}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={LEFT} x2={width - RIGHT} y1={sy(f)} y2={sy(f)} className="stroke-line" />
            <text x={LEFT - 5} y={sy(f)} dy="0.35em" textAnchor="end">
              {pct(f)}
            </text>
            <text x={width - RIGHT + 5} y={sy(f)} dy="0.35em">
              {f * CT_MAX} d
            </text>
          </g>
        ))}
        {X_TICKS.map((b) => (
          <text key={b} x={sx(b)} y={height - bottom + font + 3} textAnchor="middle">
            {b}
          </text>
        ))}
        <text x={(LEFT + width - RIGHT) / 2} y={height - bottom + font * 2 + 6} textAnchor="middle">
          buffer target, items
        </text>
      </g>

      <g style={small}>
        <g {...busySpot}>
          <line x1={LEFT} x2={LEFT + 16} y1={font} y2={font} className="stroke-accent" strokeWidth={2.5} />
          <text x={LEFT + 21} y={font} dy="0.35em" className="fill-fg">
            Weld busy
          </text>
        </g>
        <g {...cycleSpot}>
          <line
          x1={LEFT + font * 9}
          x2={LEFT + font * 9 + 16}
          y1={font}
          y2={font}
          className="stroke-fg/60"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          />
          <text x={LEFT + font * 9 + 21} y={font} dy="0.35em" className="fill-fg">
            Cycle time
          </text>
        </g>
      </g>

      <motion.path {...busySpot} d={busy} initial={false} animate={{ d: busy }} className="fill-none stroke-accent" strokeWidth={2.5} strokeLinejoin="round" />
      <motion.path
        {...cycleSpot}
        d={cycle}
        initial={false}
        animate={{ d: cycle }}
        className="fill-none stroke-fg/60"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        strokeLinejoin="round"
      />

      <motion.g initial={false} animate={{ x: sx(current.bufferTarget) }} data-current={current.bufferTarget}>
        <line {...currentSpot} y1={top - 4} y2={height - bottom} className="stroke-fg/40" strokeWidth={1} />
        <motion.g {...busySpot} initial={false} animate={{ y: sy(current.drumUtilization) }}>
          <circle r={4} className="fill-accent stroke-surface" strokeWidth={1.5} />
          {/* Clears the knee ring (r 8) when the current buffer sits on the knee. */}
          <text x={-12} dy="-0.5em" textAnchor="end" paintOrder="stroke" strokeWidth={4} className="fill-accent stroke-surface font-semibold tabular-nums" style={small}>
            {pct(current.drumUtilization)}
          </text>
        </motion.g>
        <motion.g {...cycleSpot} initial={false} animate={{ y: sy(current.cycleTime / CT_MAX) }}>
          <rect x={-3.5} y={-3.5} width={7} height={7} className="fill-fg stroke-surface" strokeWidth={1.5} />
          <text x={8} dy="1.1em" paintOrder="stroke" strokeWidth={4} className="fill-fg stroke-surface font-semibold tabular-nums" style={small}>
            {oneDay(current.cycleTime)}
          </text>
        </motion.g>
      </motion.g>

      {kneePoint && (
        <motion.g
          {...kneeSpot}
          initial={false}
          animate={{ x: sx(kneePoint.bufferTarget), y: sy(kneePoint.drumUtilization) }}
          data-knee={kneePoint.bufferTarget}
        >
          <circle r={8} className="fill-none stroke-accent" strokeWidth={1.5} />
          <text x={9} dy="-0.6em" paintOrder="stroke" strokeWidth={4} className="fill-accent stroke-surface font-medium" style={small}>
            knee
          </text>
        </motion.g>
      )}
    </svg>
  );
}
