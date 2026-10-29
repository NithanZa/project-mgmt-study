"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useMemo } from "react";
import { netCurve } from "@/engine/fast-tracking/schedule";
import { SPRING } from "./gantt";

const W = 200;
const H = 110;
const PAD = { left: 14, right: 8, top: 16, bottom: 18 };
const X_MAX = 20;
const Y_MAX = 5;
const px = (overlap: number) => PAD.left + (overlap / X_MAX) * (W - PAD.left - PAD.right);
const py = (net: number) => H - PAD.bottom - (net / Y_MAX) * (H - PAD.top - PAD.bottom);
const FADE = { duration: 0.18, ease: "easeOut" } as const;

/** The net saving parabola for one edge, with the current overlap as a point on it. Key by edge. */
export function NetCurve({ edge, overlap }: { edge: number; overlap: number }) {
  const { overlaps, xs, ys, points, peak } = useMemo(() => {
    const curve = netCurve(edge);
    const xs = curve.map((p) => px(p.overlap));
    const ys = curve.map((p) => py(p.net));
    return {
      overlaps: curve.map((p) => p.overlap),
      xs,
      ys,
      points: xs.map((x, i) => `${x},${ys[i]}`).join(" "),
      peak: curve.reduce((a, b) => (b.net > a.net ? b : a)),
    };
  }, [edge]);

  const o = useMotionValue(overlap);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      o.jump(overlap);
      return;
    }
    const controls = animate(o, overlap, SPRING);
    return () => controls.stop();
  }, [o, overlap, reduce]);
  // Interpolating over the sampled points keeps the dot exactly on the drawn polyline.
  const dotX = useTransform(o, overlaps, xs);
  const dotY = useTransform(o, overlaps, ys);

  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      className="col-start-1 row-start-1 h-full w-full overflow-visible"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
    >
      <line x1={px(0)} y1={py(0)} x2={px(X_MAX)} y2={py(0)} className="stroke-line" />
      <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(Y_MAX)} className="stroke-line" />
      <text x={px(0)} y={PAD.top - 6} className="fill-muted text-[9px]">
        net days
      </text>
      <text x={px(X_MAX)} y={H - 4} textAnchor="end" className="fill-muted text-[9px]">
        overlap {X_MAX}d
      </text>
      <line
        x1={px(peak.overlap)}
        y1={py(0)}
        x2={px(peak.overlap)}
        y2={py(peak.net)}
        strokeDasharray="2 3"
        className="stroke-muted"
      />
      <text x={px(peak.overlap)} y={H - 4} textAnchor="middle" className="fill-muted text-[9px]">
        {peak.overlap}
      </text>
      <text x={px(peak.overlap)} y={py(peak.net) - 6} textAnchor="middle" className="fill-ok text-[9px] font-semibold">
        {peak.net}
      </text>
      <polyline
        points={points}
        fill="none"
        strokeWidth={2}
        className="stroke-ok"
      />
      <motion.circle r={4.5} style={{ x: dotX, y: dotY }} className="fill-surface stroke-buffer" strokeWidth={2.5} />
    </motion.svg>
  );
}
