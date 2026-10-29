"use client";

import { AnimatePresence, motion } from "motion/react";
import { BIN_WIDTH } from "@/engine/monte-carlo/simulate";
import type { Bin } from "@/engine/monte-carlo/types";
import { FADE, linear } from "./scale";
import { useSize } from "./use-size";

const X_MIN = 7;
const X_MAX = 22;
const TICKS = [8, 10, 12, 14, 16, 18, 20];
const NARROW = 240;
const SLOTS = Array.from({ length: (X_MAX - X_MIN) / BIN_WIDTH }, (_, i) => X_MIN + i * BIN_WIDTH);
/** Until a bin holds this many runs, each run is a fixed-height step. */
const MIN_SCALE = 8;
const TOP = 30;
const AXIS = 18;

export interface HistogramProps {
  bins: Bin[];
  pert: number;
  /** Shown once there are enough runs to read them. */
  quantiles: { p50: number; p80: number } | null;
  /** Finish of the roll on display; `key` restarts the drop. */
  roll: { key: number; finish: number } | null;
}

const TONES = {
  accent: { line: "stroke-accent", text: "fill-accent" },
  float: { line: "stroke-float", text: "fill-float" },
};

function Marker({ x, label, tone, row, side }: {
  x: number;
  label: string;
  tone: keyof typeof TONES;
  row: 0 | 1;
  side: "start" | "end";
}) {
  const dashed = tone === "float";
  return (
    <motion.g data-marker={label} initial={false} animate={{ x }}>
      <line
        y1={row * 14}
        y2="100%"
        strokeWidth={dashed ? 1.5 : 2}
        strokeDasharray={dashed ? "4 3" : undefined}
        className={TONES[tone].line}
      />
      <text
        x={side === "start" ? 4 : -4}
        y={10 + row * 14}
        textAnchor={side}
        className={`text-[10px] font-medium lg:text-xs ${TONES[tone].text}`}
      >
        {label}
      </text>
    </motion.g>
  );
}

/** Finish dates of all runs so far, in half-day bins. */
export function Histogram({ bins, pert, quantiles, roll }: HistogramProps) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const plot = Math.max(0, height - TOP - AXIS);
  const x = linear(X_MIN, X_MAX, 1, width - 1);
  const counts = new Map(bins.map((b) => [b.from, b.count]));
  const scale = Math.max(MIN_SCALE, ...bins.map((b) => b.count));
  const slot = Math.max(1, x(BIN_WIDTH + X_MIN) - x(X_MIN) - 1);

  return (
    <div ref={ref} className="absolute inset-0">
      {width > 0 && (
        <svg width={width} height={height} className="overflow-visible">
          <g transform={`translate(0 ${TOP})`}>
            {SLOTS.map((from) => (
              <motion.rect
                key={from}
                x={x(from)}
                y={0}
                width={slot}
                height={plot}
                rx={1.5}
                className="fill-fg/20"
                style={{ originY: 1 }}
                initial={false}
                animate={{ scaleY: (counts.get(from) ?? 0) / scale }}
              />
            ))}
          </g>
          <svg y={0} height={TOP + plot} className="overflow-visible">
            <Marker x={x(pert)} label="PERT" tone="float" row={0} side="start" />
            <AnimatePresence>
              {quantiles && (
                <motion.g key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
                  <Marker x={x(quantiles.p50)} label="P50" tone="accent" row={1} side="end" />
                  <Marker x={x(quantiles.p80)} label="P80" tone="accent" row={1} side="start" />
                </motion.g>
              )}
            </AnimatePresence>
          </svg>
          <g transform={`translate(0 ${TOP + plot})`}>
            <line x1={0} x2={width} className="stroke-line" />
            {TICKS.filter((t) => width >= NARROW || t % 4 === 0).map((t) => (
              <text key={t} x={x(t)} y={13} textAnchor="middle" className="fill-muted text-[9px] tabular-nums lg:text-[11px]">
                {t}
              </text>
            ))}
            <text x={width} y={13} textAnchor="end" className="fill-muted text-[9px] lg:text-[11px]">
              d
            </text>
            {/* Own presence scope: the chart's initial={false} would otherwise skip the drop. */}
            <AnimatePresence>
              {roll && (
                <motion.circle
                  key={roll.key}
                  data-roll
                  cx={x(roll.finish)}
                  cy={0}
                  r={5}
                  className="fill-accent stroke-surface"
                  strokeWidth={2}
                  initial={{ y: -(TOP + plot) }}
                  animate={{ y: 0 }}
                  exit={{ opacity: 0, transition: FADE }}
                />
              )}
            </AnimatePresence>
          </g>
        </svg>
      )}
    </div>
  );
}
