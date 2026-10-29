"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { type Fever, ZONE_LINES } from "@/engine/critical-chain/fever";
import type { FeverPoint, Zone } from "@/engine/critical-chain/types";
import { pct } from "@/lib/format";
import { MOVE, SPRING } from "./motion";
import { useSize } from "./use-size";

/** Top of the y axis; points above it are pinned to the edge. */
const Y_MAX = 1.5;
const MARGIN = { top: 22, right: 10, bottom: 30, left: 38 };
/** Below this height the axis titles are dropped and the zone labels move to the right margin. */
const COMPACT_HEIGHT = 160;
const COMPACT_MARGIN = { ...MARGIN, top: 8, right: 40, bottom: 18 };

const ZONE_STYLE: Record<Zone, { band: string; fill: string; label: string }> = {
  green: { band: "fill-ok/12", fill: "fill-ok", label: "OK" },
  yellow: { band: "fill-buffer/15", fill: "fill-buffer", label: "Watch" },
  red: { band: "fill-constraint/14", fill: "fill-constraint", label: "Act" },
};

const lineAt = (line: { at0: number; slope: number }, c: number) => line.at0 + line.slope * c;

export function FeverChart({ status, points }: { status: Fever; points: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(ref);
  const compact = height < COMPACT_HEIGHT;
  const m = compact ? COMPACT_MARGIN : MARGIN;
  const w = Math.max(0, width - m.left - m.right);
  const h = Math.max(0, height - m.top - m.bottom);
  const X = (c: number) => m.left + c * w;
  const Y = (u: number) => m.top + (1 - Math.min(u, Y_MAX) / Y_MAX) * h;
  const at = (p: FeverPoint) => ({ x: X(p.chainComplete), y: Y(p.bufferUsed) });
  const poly = (pts: [number, number][]) => pts.map(([c, u]) => `${X(c)},${Y(u)}`).join(" ");

  const { yellow, red } = ZONE_LINES;
  const bands: [Zone, [number, number][]][] = [
    ["green", [[0, 0], [1, 0], [1, lineAt(yellow, 1)], [0, yellow.at0]]],
    ["yellow", [[0, yellow.at0], [1, lineAt(yellow, 1)], [1, lineAt(red, 1)], [0, red.at0]]],
    ["red", [[0, red.at0], [1, lineAt(red, 1)], [1, Y_MAX], [0, Y_MAX]]],
  ];
  // Compact charts label each band at its right edge, outside the plot.
  const bandLabels: [Zone, number, number][] = compact
    ? [
        ["green", 1, lineAt(yellow, 1) / 2],
        ["yellow", 1, (lineAt(yellow, 1) + lineAt(red, 1)) / 2],
        ["red", 1, (lineAt(red, 1) + Y_MAX) / 2],
      ]
    : [
        ["green", 0.9, lineAt(yellow, 0.9) / 2],
        ["yellow", 0.9, (lineAt(yellow, 0.9) + lineAt(red, 0.9)) / 2],
        ["red", 0.1, (1 + Y_MAX) / 2],
      ];

  const trail = Array.from({ length: points }, (_, i) => status.trail[Math.min(i, status.trail.length - 1)]);
  const trailPath = trail.map((p, i) => `${i ? "L" : "M"} ${X(p.chainComplete)} ${Y(p.bufferUsed)}`).join(" ");
  const now = at(status);
  const style = ZONE_STYLE[status.zone];
  const labelLeft = status.chainComplete > 0.8;

  return (
    <div ref={ref} className="absolute inset-0">
      {width > 0 && h > 0 && (
        <svg width={width} height={height} aria-hidden className="block overflow-visible">
          {bands.map(([z, pts]) => (
            <polygon key={z} points={poly(pts)} className={ZONE_STYLE[z].band} />
          ))}
          {bandLabels.map(([z, c, u]) => (
            <text
              key={z}
              data-zone-label={z}
              x={compact ? X(c) + 4 : X(c)}
              y={Y(u)}
              textAnchor={compact ? "start" : "middle"}
              dominantBaseline="middle"
              className={`font-semibold ${compact ? "text-[0.6rem]" : "text-[0.7rem]"} ${ZONE_STYLE[z].fill}`}
            >
              {ZONE_STYLE[z].label}
            </text>
          ))}

          {[0, 0.5, 1, 1.5].map((u) => (
            <g key={u}>
              <line
                x1={X(0)}
                x2={X(1)}
                y1={Y(u)}
                y2={Y(u)}
                className={u === 1 ? "stroke-muted" : "stroke-line"}
                strokeDasharray={u === 1 ? "3 3" : undefined}
              />
              <text
                x={X(0) - 6}
                y={Y(u)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted text-[0.65rem] tabular-nums"
              >
                {pct(u)}
              </text>
            </g>
          ))}
          {[0, 0.5, 1].map((c) => (
            <text
              key={c}
              x={X(c)}
              y={Y(0) + 13}
              textAnchor="middle"
              className="fill-muted text-[0.65rem] tabular-nums"
            >
              {pct(c)}
            </text>
          ))}
          {!compact && (
            <>
              <text x={X(0) - 6} y={m.top - 10} className="fill-muted text-[0.65rem]">
                Buffer used
              </text>
              <text x={X(1)} y={Y(0) + 26} textAnchor="end" className="fill-muted text-[0.65rem]">
                Chain complete
              </text>
            </>
          )}

          <motion.path
            initial={false}
            animate={{ d: trailPath }}
            transition={MOVE}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            className="stroke-fg/60"
          />
          {trail.slice(0, -1).map((p, i) => (
            <motion.circle
              key={i}
              r={2.5}
              initial={false}
              animate={at(p)}
              transition={SPRING}
              className="fill-fg/60"
            />
          ))}

          <motion.g data-fever-point={status.zone} initial={false} animate={now} transition={SPRING}>
            <circle r={7} strokeWidth={2} className={`stroke-surface ${style.fill}`} />
            <text
              x={labelLeft ? -11 : 11}
              y={-9}
              textAnchor={labelLeft ? "end" : "start"}
              className="fill-fg text-xs font-semibold tabular-nums"
            >
              {pct(status.bufferUsed)} {style.label}
            </text>
          </motion.g>
        </svg>
      )}
    </div>
  );
}
