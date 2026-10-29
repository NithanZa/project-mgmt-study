"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { HOUSE, MAX_OVERLAP } from "@/engine/fast-tracking/fixture";
import { clampOverlap, type Schedule } from "@/engine/fast-tracking/schedule";
import type { Overlaps } from "@/engine/fast-tracking/types";

const AXIS_DAYS = 90;
const TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
export const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.4 } as const;

/** Pixels per day of the measured track, 0 until measured. */
function useDayScale(ref: RefObject<HTMLDivElement | null>): number {
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.getBoundingClientRect().width / AXIS_DAYS);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
}

/** Springs a motion value to `target`; jumps when the scale changes or motion is reduced. */
function useSpringTo(value: MotionValue<number>, target: number, scale: number, paused: RefObject<boolean>) {
  const reduce = useReducedMotion();
  const lastScale = useRef(scale);
  useEffect(() => {
    if (paused.current) return;
    if (reduce || lastScale.current !== scale) {
      lastScale.current = scale;
      value.jump(target);
      return;
    }
    const controls = animate(value, target, SPRING);
    return () => controls.stop();
  }, [value, target, scale, reduce, paused]);
}

export interface GanttProps {
  result: Schedule;
  overlaps: Overlaps;
  /** Edges whose successor bar can be dragged. */
  draggable: readonly number[];
  pulse: boolean;
  onOverlap: (edge: number, overlap: number) => void;
  onActivate: (edge: number) => void;
}

export function Gantt({ result, overlaps, draggable, pulse, onOverlap, onActivate }: GanttProps) {
  const track = useRef<HTMLDivElement>(null);
  const scale = useDayScale(track);

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ touchAction: "pan-y" }}>
      <div ref={track} className="relative mx-3 min-h-0 flex-1">
        {TICKS.map((t) => (
          <div
            key={t}
            aria-hidden
            className="absolute inset-y-0 border-l border-line"
            style={{ left: `${(t / AXIS_DAYS) * 100}%` }}
          />
        ))}
        {scale > 0 && (
          <>
            <div className="absolute inset-0 flex flex-col pb-1">
              {HOUSE.map((phase, i) => {
                const edge = i - 1;
                return (
                  <div key={phase.id} className="relative min-h-0 flex-1">
                    <GanttBar
                      name={phase.name}
                      days={phase.days}
                      start={result.bars[i].start}
                      scale={scale}
                      edge={edge}
                      overlap={edge >= 0 ? overlaps[edge] : 0}
                      predEnd={edge >= 0 ? result.bars[edge].end : 0}
                      rework={edge >= 0 ? result.edges[edge].expectedRework : 0}
                      draggable={draggable.includes(edge)}
                      pulse={pulse && edge === 0}
                      onOverlap={onOverlap}
                      onActivate={onActivate}
                    />
                  </div>
                );
              })}
            </div>
            <Marker
              day={result.planned}
              scale={scale}
              label="Plan"
              className="border-accent text-accent"
              top
            />
            <Marker
              day={result.expected}
              scale={scale}
              label="Exp."
              className="border-dashed border-buffer text-buffer"
            />
          </>
        )}
      </div>
      <div aria-hidden className="relative mx-3 h-4 text-[10px] tabular-nums text-muted">
        {TICKS.filter((t) => t % 20 === 0).map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2"
            style={{ left: `${(t / AXIS_DAYS) * 100}%` }}
          >
            {t}
          </span>
        ))}
        <span className="absolute right-0 translate-x-3">d</span>
      </div>
    </div>
  );
}

function Marker({
  day,
  scale,
  label,
  className,
  top = false,
}: {
  day: number;
  scale: number;
  label: string;
  className: string;
  top?: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ x: day * scale }}
      transition={SPRING}
      className={`pointer-events-none absolute inset-y-0 left-0 border-l-2 ${className}`}
    >
      <span
        className={`absolute left-1 rounded-sm bg-surface px-0.5 text-[10px] font-semibold leading-tight whitespace-nowrap tabular-nums ${top ? "top-0" : "bottom-0"}`}
      >
        {label} {Math.round(day)}
      </span>
    </motion.div>
  );
}

interface GanttBarProps {
  name: string;
  days: number;
  start: number;
  scale: number;
  /** Incoming edge index, -1 for the first phase. */
  edge: number;
  overlap: number;
  predEnd: number;
  rework: number;
  draggable: boolean;
  pulse: boolean;
  onOverlap: (edge: number, overlap: number) => void;
  onActivate: (edge: number) => void;
}

function GanttBar({
  name,
  days,
  start,
  scale,
  edge,
  overlap,
  predEnd,
  rework,
  draggable,
  pulse,
  onOverlap,
  onActivate,
}: GanttBarProps) {
  const x = useMotionValue(start * scale);
  const dragging = useRef(false);
  useSpringTo(x, start * scale, scale, dragging);
  // The hatch lives in track coordinates inside the clipped bar, so it always ends at predEnd.
  const hatchX = useTransform(x, [0, 1], [0, -1], { clamp: false });
  const reduce = useReducedMotion();
  const max = edge >= 0 ? MAX_OVERLAP[edge] : 0;
  const maxRework = edge >= 0 ? max ** 2 / HOUSE[edge].days : 0;

  const overlapAt = () => clampOverlap(edge, Math.round(predEnd - x.get() / scale));

  const move = (delta: number) => onOverlap(edge, clampOverlap(edge, overlap + delta));

  return (
    <motion.div
      style={{ x, width: days * scale }}
      className={`absolute top-0 left-0 flex h-full flex-col justify-end gap-0.5 rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent ${draggable ? "cursor-grab touch-pan-y active:cursor-grabbing" : ""}`}
      drag={draggable ? "x" : false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: (predEnd - max) * scale, right: predEnd * scale }}
      onDragStart={() => {
        dragging.current = true;
        onActivate(edge);
      }}
      onDrag={() => onOverlap(edge, overlapAt())}
      onDragEnd={() => {
        dragging.current = false;
        const snapped = overlapAt();
        onOverlap(edge, snapped);
        const target = (predEnd - snapped) * scale;
        if (reduce) x.jump(target);
        else animate(x, target, SPRING);
      }}
      {...(draggable && {
        role: "slider",
        tabIndex: 0,
        "aria-label": `${name} start day`,
        "aria-valuemin": predEnd - max,
        "aria-valuemax": predEnd,
        "aria-valuenow": start,
        "aria-valuetext": `starts day ${start}, overlapping ${overlap} days`,
        onFocus: () => onActivate(edge),
        onKeyDown: (e: KeyboardEvent) => {
          const step = e.shiftKey ? 5 : 1;
          if (e.key === "ArrowLeft") move(step);
          else if (e.key === "ArrowRight") move(-step);
          else if (e.key === "Home") move(-overlap);
          else if (e.key === "End") move(max);
          else return;
          e.preventDefault();
        },
      })}
    >
      <span className="flex gap-1 whitespace-nowrap text-[10px] leading-none text-muted sm:text-xs">
        <span className="font-medium text-fg">{name}</span>
        {days}d
        {overlap > 0 && <span className="font-semibold text-buffer">−{overlap}</span>}
      </span>
      <div className="relative h-[45%] max-h-9 min-h-1.5">
        {pulse && (
          <motion.div
            aria-hidden
            className="absolute -inset-1 rounded-md border-2 border-accent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            // Three pulses (under 5 s), so the hint never blinks on indefinitely.
            transition={{ duration: 0.6, ease: "easeOut", repeat: 2, repeatDelay: 0.9 }}
          />
        )}
        <div
          className={`relative h-full overflow-hidden rounded-sm border-accent bg-accent-soft ${draggable ? "border-2" : "border"}`}
        >
          {edge >= 0 && (
            <motion.div
              aria-hidden
              className="hatch absolute inset-y-0 left-0 text-buffer"
              style={{ x: hatchX, width: predEnd * scale }}
            />
          )}
        </div>
        {maxRework > 0 && (
          <div
            aria-hidden
            className="absolute inset-y-0 left-full overflow-hidden"
            style={{ width: maxRework * scale }}
          >
            <motion.div
              className="h-full rounded-r-sm border-2 border-l-0 border-dotted border-buffer"
              initial={false}
              animate={{ x: (rework - maxRework) * scale }}
              transition={SPRING}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
