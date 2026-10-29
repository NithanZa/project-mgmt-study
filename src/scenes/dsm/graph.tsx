"use client";

import { motion } from "motion/react";
import type { Mark } from "@/engine/dsm/types";
import { FADE, LOOPS, MARKS, NAME, SPRING, edgeKey, nodeLayoutId } from "./model";

type Pt = [number, number];

/** Layer (left to right) and lane of each node; the E → P → T loop forms a triangle. */
const POS: Record<string, Pt> = {
  M: [0, 0],
  C: [1, 0],
  I: [2, 0],
  E: [3, 0],
  P: [4, 1],
  T: [5, 0],
  L: [4, -1],
  R: [6, 0],
};
/** Control points for edges that would otherwise cross a node. */
const BEND: Record<string, Pt> = { "C>E": [2, -1], "T>E": [4, 0.6] };
const LOOP_KEYS = new Set(LOOPS.map(edgeKey));

export interface GraphProps {
  /** Full-canvas variant whose nodes morph into the matrix row headers. */
  big?: boolean;
  /** Lay layers out top to bottom instead of left to right. */
  rotated?: boolean;
  hot?: Mark | null;
}

export function Graph({ big = false, rotated = false, hot = null }: GraphProps) {
  const r = big ? 30 : 36;
  const long = 700;
  const short = big ? 360 : 300;
  const [w, h] = rotated ? [short, long] : [long, short];
  const at = ([layer, lane]: Pt): Pt =>
    rotated ? [short / 2 + lane * 100, 50 + layer * 100] : [50 + layer * 100, short / 2 + lane * 100];
  const hotKey = hot ? edgeKey(hot) : null;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div
      className="@container relative"
      style={{ width: `min(100cqw, ${w / h} * 100cqh)`, aspectRatio: `${w} / ${h}` }}
    >
      <motion.svg
        viewBox={`0 0 ${w} ${h}`}
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={FADE}
      >
        <defs>
          {(["muted", "accent", "constraint"] as const).map((c) => (
            <marker
              key={c}
              id={`dsm-arrow-${c}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="12"
              markerHeight="12"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 Z" style={{ fill: `var(--${c})` }} />
            </marker>
          ))}
        </defs>
        {MARKS.map((m) => {
          const key = edgeKey(m);
          const loop = LOOP_KEYS.has(key);
          const isHot = key === hotKey;
          const d = edgePath(at(POS[m.col]), at(POS[m.row]), r, BEND[key] && at(BEND[key]));
          const color = loop ? "constraint" : isHot ? "accent" : "muted";
          return (
            <g key={key}>
              {isHot && (
                <motion.path
                  key={`pulse-${key}`}
                  d={d}
                  fill="none"
                  strokeWidth={14}
                  strokeLinecap="round"
                  style={{ stroke: `var(--${loop ? "constraint" : "accent"})` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.35, 0.15] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
              <path
                d={d}
                data-edge={key}
                data-hot={isHot || undefined}
                fill="none"
                strokeWidth={isHot ? 5 : loop ? 3 : 2}
                strokeDasharray={loop ? "8 5" : undefined}
                markerEnd={`url(#dsm-arrow-${color})`}
                style={{ stroke: `var(--${color})` }}
              />
            </g>
          );
        })}
      </motion.svg>
      {Object.entries(POS).map(([id, p]) => {
        const [x, y] = at(p);
        const lit = hot && (hot.row === id || hot.col === id);
        return (
          <div
            key={id}
            className="absolute"
            style={{
              left: pct(x, w),
              top: pct(y, h),
              width: pct(2 * r, w),
              marginLeft: pct(-r, w),
              marginTop: pct(-r, w),
              aspectRatio: "1",
            }}
          >
            <motion.div
              layoutId={big ? nodeLayoutId(id) : undefined}
              transition={SPRING}
              data-node={id}
              className={`flex size-full items-center justify-center border-2 bg-surface font-semibold ${lit ? "border-accent text-accent" : "border-fg/60 text-fg"}`}
              style={{ borderRadius: "50%", fontSize: `max(8px, ${(r * 90) / w}cqw)` }}
            >
              {id}
            </motion.div>
            {big && !rotated && (
              <motion.span
                className={`absolute left-1/2 hidden w-max max-w-28 -translate-x-1/2 rounded bg-surface/85 px-1 text-center text-xs leading-tight text-balance text-muted @min-[30rem]:block ${p[1] < 0 ? "bottom-full mb-1" : "top-full mt-1"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={FADE}
              >
                {NAME[id]}
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Straight or quadratic edge between two node centres, trimmed to the node rims. */
function edgePath(from: Pt, to: Pt, r: number, bend?: Pt): string {
  const toward = (a: Pt, b: Pt, by: number): Pt => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a[0] + ((b[0] - a[0]) / len) * by, a[1] + ((b[1] - a[1]) / len) * by];
  };
  const a = toward(from, bend ?? to, r + 2);
  const b = toward(to, bend ?? from, r + 4);
  const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return bend ? `M${f(a)} Q${f(bend)} ${f(b)}` : `M${f(a)} L${f(b)}`;
}
