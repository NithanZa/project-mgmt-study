"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { pct } from "@/lib/format";
import { AXIS_MAX, type Bell, bellPath, bellTop, FADE, invertX, MOTION, type Scale, SPRING } from "./geometry";
import { commitDays } from "./format";

export interface ProjectCurveProps {
  bell: Bell;
  x: Scale;
  base: number;
  deadline: number;
  visible: boolean;
  /** Hide the mean label when there is no room above the peak. */
  compact: boolean;
}

export function ProjectCurve({ bell, x, base, deadline, visible, compact }: ProjectCurveProps) {
  const peak = bellTop(bell, base);
  return (
    <motion.g initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={FADE}>
      <motion.path
        data-shade
        className="fill-accent/25"
        initial={false}
        animate={{ d: bellPath(bell, x, base, 0, deadline, true) }}
        transition={MOTION}
      />
      <motion.path
        data-bell
        className="fill-none stroke-accent"
        strokeWidth={2.5}
        initial={false}
        animate={{ d: bellPath(bell, x, base, 0, AXIS_MAX, false) }}
        transition={MOTION}
      />
      <motion.g data-mean initial={false} animate={{ x: x(bell.mean) }} transition={MOTION}>
        <motion.path
          className="stroke-fg"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          initial={false}
          animate={{ d: `M0 ${base}V${peak}` }}
          transition={MOTION}
        />
        <motion.text
          textAnchor="middle"
          className="fill-fg text-[11px] font-semibold tabular-nums"
          initial={false}
          animate={{ y: peak - 6, opacity: compact ? 0 : 1 }}
          transition={MOTION}
        >
          mean {bell.mean.toFixed(1)}
        </motion.text>
      </motion.g>
    </motion.g>
  );
}

export const DEADLINE_MIN = 12;
export const DEADLINE_MAX = 21;
const STEP = 0.5;
const INSTANT = { duration: 0 } as const;

const clamp = (d: number) => Math.min(DEADLINE_MAX, Math.max(DEADLINE_MIN, d));
const snap = (d: number) => clamp(Math.round(d / STEP) * STEP);

/** Moves one grid step from `d`, landing on the grid even when `d` is off it. */
function step(d: number, dir: 1 | -1): number {
  const onGrid = dir > 0 ? Math.floor(d / STEP) * STEP : Math.ceil(d / STEP) * STEP;
  return clamp(onGrid + dir * STEP);
}

export interface DeadlineHandleProps {
  x: Scale;
  width: number;
  top: number;
  base: number;
  deadline: number;
  probability: number;
  visible: boolean;
  interactive: boolean;
  onChange: (deadline: number) => void;
}

/** Deadline line over the project curve: drag it, or focus it and use the arrow keys. */
export function DeadlineHandle({
  x,
  width,
  top,
  base,
  deadline,
  probability,
  visible,
  interactive,
  onChange,
}: DeadlineHandleProps) {
  const px = x(deadline);
  const offset = useMotionValue(px);
  const dragging = useRef(false);
  // Imperative animate() ignores MotionConfig, so honour reduced motion here.
  const glide = useReducedMotion() ? INSTANT : SPRING;

  useEffect(() => {
    if (dragging.current) return;
    const controls = animate(offset, px, glide);
    return () => controls.stop();
  }, [offset, px, glide]);

  const fromPointer = () => snap(invertX(width, offset.get()));

  const onKeyDown = (e: KeyboardEvent) => {
    const next =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? step(deadline, 1)
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? step(deadline, -1)
          : e.key === "Home"
            ? DEADLINE_MIN
            : e.key === "End"
              ? DEADLINE_MAX
              : null;
    if (next === null) return;
    e.preventDefault();
    onChange(next);
  };

  const text = `${commitDays(deadline)} days, ${pct(probability)} chance`;

  return (
    <motion.div
      data-deadline
      role={interactive ? "slider" : undefined}
      aria-label={interactive ? "Deadline" : undefined}
      aria-valuemin={interactive ? DEADLINE_MIN : undefined}
      aria-valuemax={interactive ? DEADLINE_MAX : undefined}
      aria-valuenow={interactive ? deadline : undefined}
      aria-valuetext={interactive ? text : undefined}
      aria-hidden={interactive ? undefined : true}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={interactive ? onKeyDown : undefined}
      drag={interactive ? "x" : false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: x(DEADLINE_MIN), right: x(DEADLINE_MAX) }}
      onDragStart={() => {
        dragging.current = true;
      }}
      onDrag={() => onChange(fromPointer())}
      onDragEnd={() => {
        dragging.current = false;
        const snapped = fromPointer();
        onChange(snapped);
        animate(offset, x(snapped), glide);
      }}
      style={{ x: offset, top: top - 2, height: base - top + 2 }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={FADE}
      className={`group absolute left-0 -ml-5 flex w-10 touch-none justify-center outline-none ${interactive ? "cursor-ew-resize" : "pointer-events-none"}`}
    >
      <span
        className={`absolute top-0 rounded-full px-1.5 py-px text-[11px] font-semibold whitespace-nowrap tabular-nums ${interactive ? "bg-fg text-bg group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent" : "bg-surface-2 text-fg"}`}
      >
        {commitDays(deadline)} d
      </span>
      <span className="mt-4 h-full w-0.5 rounded-full bg-fg" />
      <span
        data-probability
        className="absolute top-[72%] right-[calc(50%+4px)] rounded-sm bg-surface/85 px-0.5 text-sm font-semibold tabular-nums text-fg"
      >
        {pct(probability)}
      </span>
    </motion.div>
  );
}
