"use client";

import { motion } from "motion/react";

const FADE = { duration: 0.18, ease: "easeOut" } as const;

export interface RopeProps {
  /** Bottom centre of the drum tile and of the gate, and the lane the rope runs along. */
  drumX: number;
  gateX: number;
  from: number;
  laneY: number;
  font: number;
  on: boolean;
}

/** The signal line from the drum back to the release gate; it draws itself when switched on. */
export function Rope({ drumX, gateX, from, laneY, font, on }: RopeProps) {
  const r = Math.max(0, Math.min(6, laneY - from));
  const d = `M ${drumX} ${from} V ${laneY - r} Q ${drumX} ${laneY} ${drumX - r} ${laneY} H ${gateX + r} Q ${gateX} ${laneY} ${gateX} ${laneY - r} V ${from}`;
  const labelX = (drumX + gateX) / 2;
  return (
    <g aria-hidden data-rope={on ? "on" : "off"}>
      <motion.path
        d={d}
        className="fill-none stroke-accent"
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={on ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ pathLength: { duration: 0.6, ease: "easeInOut" }, opacity: FADE }}
      />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ ...FADE, delay: on ? 0.4 : 0 }}>
        <rect x={labelX - font * 1.4} y={laneY - font * 0.6} width={font * 2.8} height={font * 1.2} rx={3} className="fill-surface" />
        <text x={labelX} y={laneY} dy="0.35em" textAnchor="middle" className="fill-accent font-medium" style={{ fontSize: font * 0.85 }}>
          rope
        </text>
      </motion.g>
    </g>
  );
}
