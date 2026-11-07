"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useSpot, useSpots } from "@/components/lesson/spotlight";
import { SPRING_AND_FADE } from "@/components/transitions";
import type { TotalPoint } from "@/engine/crashing/crash";
import { money } from "@/lib/format";

const LEFT = 44;
const RIGHT = 56;
const TOP = 16;
const BOTTOM = 30;
const MAX_H = 260;
/** Axis tops; each splits into four round gridline steps. */
const Y_MAX = [4000, 8000, 12000, 16000, 20000, 24000, 32000, 40000];
const FADE = { duration: 0.18, ease: "easeOut" } as const;
const INSTANT = { duration: 0 } as const;

export interface CostChartProps {
  /** Days and direct cost of each state the learner has visited. */
  points: { days: number; direct: number }[];
  /** Cheapest-first crash curve with overhead and total costs. */
  totals: TotalPoint[];
  best: { days: number; total: number };
  /** Overhead per day, for the overhead line's label. */
  overhead: number;
  showOverhead: boolean;
  showTotal: boolean;
}

const line = (xy: [number, number][]) => xy.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
const kilo = (v: number) => (v === 0 ? "$0" : `$${v / 1000}k`);

/**
 * A viewBox with the container's aspect ratio, about one unit per pixel when
 * the slot is short (phones), so labels stay legible instead of shrinking with
 * a letterboxed drawing. `resized` is true for the frame a resize lands in,
 * so the chart can jump to the new geometry instead of springing after it
 * (the controls strip sliding in would otherwise chain springs past 600 ms).
 */
function useViewBox(ref: RefObject<SVGSVGElement | null>) {
  const [box, setBox] = useState({ w: 420, h: MAX_H, resized: false });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const h = Math.round(Math.min(MAX_H, Math.max(100, height * 1.2)));
      const w = Math.max(300, Math.round((h * width) / height));
      setBox((b) => (b.w === w && b.h === h ? b : { w, h, resized: true }));
    });
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, [ref]);
  useEffect(() => {
    if (!box.resized) return;
    const id = requestAnimationFrame(() => setBox((b) => ({ ...b, resized: false })));
    return () => cancelAnimationFrame(id);
  }, [box]);
  return box;
}

export function CostChart({ points, totals, best, overhead, showOverhead, showTotal }: CostChartProps) {
  const ref = useRef<SVGSVGElement>(null);
  const { w: W, h: H, resized } = useViewBox(ref);
  // Jump on resize. Reduced motion already stops transforms, but path data and
  // pathLength are not transforms, so stop those here too.
  const reduce = useReducedMotion();
  const morph = reduce || resized ? INSTANT : undefined;
  const move = resized ? INSTANT : undefined;
  const directSpot = useSpot("direct");
  const pointSpot = useSpots(["direct", "point"]);
  const overheadSpot = useSpot("overhead");
  const totalSpot = useSpot("total");
  const minSpot = useSpot("min");
  const grid = H < 160 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
  const lo = totals[totals.length - 1].days;
  const hi = totals[0].days;
  // The axis makes room for the total as soon as overhead shows, so the total line arrives without a rescale.
  const top = Math.max(
    ...points.map((p) => p.direct),
    ...totals.map((p) => (showOverhead ? p.total : p.direct)),
  );
  const yMax = Y_MAX.find((m) => m >= top) ?? Y_MAX[Y_MAX.length - 1];
  const sx = (days: number) => LEFT + ((days - lo) / (hi - lo)) * (W - LEFT - RIGHT);
  const sy = (dollars: number) => H - BOTTOM - (dollars / yMax) * (H - TOP - BOTTOM);
  const xy = points.map((p): [number, number] => [sx(p.days), sy(p.direct)]);
  const ticks = totals.map((p) => p.days);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="size-full" aria-hidden>
      {grid.map((f) => (
        <g key={f}>
          <line x1={LEFT} x2={W - RIGHT} y1={sy(f * yMax)} y2={sy(f * yMax)} className="stroke-line" />
          <text x={LEFT - 6} y={sy(f * yMax) + 3.5} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
            {kilo(f * yMax)}
          </text>
        </g>
      ))}
      {ticks.map((d) => (
        <text key={d} x={sx(d)} y={H - BOTTOM + 15} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
          {d}
        </text>
      ))}
      <text x={W - RIGHT + 14} y={H - BOTTOM + 15} className="fill-muted text-[10px]">
        days
      </text>

      {/* Both groups fade inline, which would beat the spotlight, so their children carry the tags. */}
      <motion.g initial={false} animate={{ opacity: showOverhead ? 1 : 0 }} transition={FADE} data-overhead={showOverhead}>
        <motion.path
          {...overheadSpot}
          initial={false}
          animate={{ d: line(totals.map((p) => [sx(p.days), sy(p.overhead)])) }}
          transition={morph}
          className="fill-none stroke-float"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <motion.text
          {...overheadSpot}
          initial={false}
          animate={{ x: sx(lo) + 4, y: sy(totals[totals.length - 1].overhead) + 14 }}
          transition={move}
          className="fill-float text-[10px] tabular-nums"
        >
          −{money(overhead)}/d
        </motion.text>
      </motion.g>

      <motion.g initial={false} animate={{ opacity: showTotal ? 1 : 0 }} transition={FADE} data-total={showTotal}>
        <motion.path
          {...totalSpot}
          initial={false}
          animate={{ d: line(totals.map((p) => [sx(p.days), sy(p.total)])) }}
          transition={morph}
          className="fill-none stroke-accent"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <motion.text
          {...totalSpot}
          initial={false}
          animate={{ x: sx(hi) + 8, y: sy(totals[0].total) + 3.5 }}
          transition={move}
          className="fill-accent text-[10px] font-semibold"
        >
          total
        </motion.text>
        <motion.path
          {...minSpot}
          initial={false}
          animate={{ d: `M ${sx(best.days)} ${sy(best.total) + 8} L ${sx(best.days)} ${H - BOTTOM}` }}
          transition={morph}
          className="stroke-accent"
          strokeDasharray="2 3"
        />
        <motion.g
          {...minSpot}
          initial={false}
          animate={{ x: sx(best.days), y: sy(best.total) }}
          transition={move}
          data-optimum={best.days}
        >
          <circle r={6} className="fill-accent stroke-surface" strokeWidth={2} />
          <text y={-11} textAnchor="middle" className="fill-accent text-[10px] font-semibold">
            min
          </text>
        </motion.g>
      </motion.g>

      {/* Segments and step prices fade in and out inline, so their group carries the tag. */}
      <g {...directSpot}>
        <AnimatePresence initial={false}>
          {xy.slice(1).map((to, i) => {
            const d = line([xy[i], to]);
            return (
              <motion.path
                key={`seg-${i}`}
                initial={{ pathLength: 0, d }}
                animate={{ pathLength: 1, d }}
                transition={morph}
                exit={{ opacity: 0, transition: FADE }}
                className="fill-none stroke-buffer"
                strokeWidth={2}
              />
            );
          })}
          {xy.slice(1).map((to, i) => {
            const price = points[i + 1].direct - points[i].direct;
            // Above the segment's middle; a step that saves no day is vertical, so its price sits to its
            // left, clear of the previous step's label.
            const vertical = to[0] === xy[i][0];
            const x = (xy[i][0] + to[0]) / 2 - (vertical ? 7 : 0);
            const y = (xy[i][1] + to[1]) / 2 + (vertical ? 3 : -7);
            return (
              <motion.text
                key={`price-${i}`}
                data-step-price={price}
                textAnchor={vertical ? "end" : "middle"}
                className="fill-buffer text-[9px] tabular-nums"
                initial={{ x, y, opacity: 0 }}
                animate={{ x, y, opacity: 1 }}
                transition={resized ? INSTANT : SPRING_AND_FADE}
                exit={{ opacity: 0, transition: FADE }}
              >
                +{money(price)}
              </motion.text>
            );
          })}
        </AnimatePresence>
        <text x={sx(hi) + 8} y={sy(0) - 6} className="fill-buffer text-[10px] font-semibold">
          direct
        </text>
      </g>
      <AnimatePresence initial={false}>
        {xy.map(([x, y], i) => {
          const last = i === xy.length - 1;
          return (
            <motion.circle
              key={`pt-${i}`}
              {...(last ? pointSpot : directSpot)}
              r={last ? 5 : 3.5}
              className={last ? "fill-surface stroke-buffer" : "fill-buffer"}
              strokeWidth={2.5}
              data-point={i}
              initial={{ x, y, scale: 0 }}
              animate={{ x, y, scale: 1 }}
              transition={move}
              exit={{ opacity: 0, transition: FADE }}
            />
          );
        })}
      </AnimatePresence>
    </svg>
  );
}
