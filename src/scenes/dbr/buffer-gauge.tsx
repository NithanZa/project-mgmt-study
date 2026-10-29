"use client";

import { motion } from "motion/react";

const FADE = { duration: 0.18, ease: "easeOut" } as const;
const FILL = { duration: 0.12, ease: "linear" } as const;

export interface BufferGaugeProps {
  x: number;
  top: number;
  bottom: number;
  width: number;
  /** Items the rope counts: everything at or before the drum. */
  count: number;
  target: number;
  max: number;
  /** The drum had capacity this day but nothing to work on. */
  starved: boolean;
  visible: boolean;
  font: number;
  hatchId: string;
}

export function BufferGauge({ x, top, bottom, width, count, target, max, starved, visible, font, hatchId }: BufferGaugeProps) {
  const h = bottom - top;
  const targetY = bottom - (Math.min(target, max) / max) * h;
  return (
    <motion.g
      data-gauge
      data-buffer={count}
      data-target={target}
      data-starved={starved}
      aria-hidden
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={FADE}
    >
      {h >= font * 5 && (
        <text
          transform={`translate(${x - font * 2.3} ${bottom}) rotate(-90)`}
          dy="0.35em"
          className="fill-muted"
          style={{ fontSize: font * 0.8 }}
        >
          buffer
        </text>
      )}
      <rect x={x} y={top} width={width} height={h} rx={2} className="fill-surface-2 stroke-line" />
      <motion.rect
        x={x}
        y={top}
        width={width}
        height={h}
        rx={2}
        className="fill-buffer/70"
        style={{ originY: 1 }}
        initial={false}
        animate={{ scaleY: Math.min(count, max) / max }}
        transition={FILL}
      />
      <motion.g initial={false} animate={{ opacity: starved ? 1 : 0 }} transition={FADE}>
        <rect x={x} y={top} width={width} height={h} rx={2} fill={`url(#${hatchId})`} />
        <rect x={x - 1} y={top - 1} width={width + 2} height={h + 2} rx={3} className="fill-none stroke-constraint" strokeWidth={2} />
        <circle cx={x + width / 2} cy={top - font * 0.75} r={font * 0.6} className="fill-constraint" />
        <text x={x + width / 2} y={top - font * 0.75} dy="0.36em" textAnchor="middle" className="fill-surface font-bold" style={{ fontSize: font * 0.85 }}>
          !
        </text>
      </motion.g>
      <motion.g initial={false} animate={{ y: targetY }}>
        <line x1={x - 3} x2={x + width + 3} className="stroke-fg" strokeWidth={1.5} />
        <text x={x - 5} dy="0.35em" textAnchor="end" className="fill-fg tabular-nums" style={{ fontSize: font * 0.8 }}>
          {target}
        </text>
      </motion.g>
    </motion.g>
  );
}
