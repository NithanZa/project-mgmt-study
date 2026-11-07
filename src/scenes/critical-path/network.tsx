"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useId, useState } from "react";
import { useSpot, useSpots } from "@/components/lesson/spotlight";
import { COFFEE_SHOP } from "@/engine/critical-path/fixture";
import type { CpmResult, Task, TaskTimes } from "@/engine/critical-path/types";
import { FADE, TRANSITION } from "./motion";

export type Reveal = "none" | "forward" | "backward" | "all";

const COLS = 5;
const ROWS = 3;
/** Float that fills a node's float bar. */
const FLOAT_FULL = 6;
/** Tasks that wait for each task. The sandbox changes weeks only, never dependencies. */
const SUCCESSORS = new Map(
  COFFEE_SHOP.map((t) => [t.id, COFFEE_SHOP.filter((s) => s.deps.includes(t.id)).map((s) => s.id)]),
);
/** Rings the neighbour value a hovered node's pass reads. */
const EMPHASIS = "rounded-sm ring-2 ring-fg";

interface Point {
  x: number;
  y: number;
}

interface Metrics {
  colW: number;
  rowH: number;
  /** Vertical offset that centres the grid in the available height. */
  top: number;
  nodeW: number;
  nodeH: number;
  compact: boolean;
  numbers: boolean;
}

function metrics(width: number, height: number): Metrics {
  const colW = width / COLS;
  const compact = colW < 120 || height / ROWS < 90;
  const rowH = Math.min(height / ROWS, compact ? colW * 1.2 : 150);
  const nodeW = Math.min(colW * (compact ? 0.82 : 0.8), 136);
  const nodeH = compact ? Math.min(18, rowH - 4) : 48;
  const numbers = rowH >= nodeH + (compact ? 24 : 36);
  return { colW, rowH, top: (height - rowH * ROWS) / 2, nodeW, nodeH, compact, numbers };
}

const weeks = (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`;

const center = (task: Task, m: Metrics): Point => ({
  x: (task.pos.col + 0.5) * m.colW,
  y: m.top + (task.pos.row + 0.5) * m.rowH,
});

/** Where the segment from `from` towards `to` leaves a box of half-size hw × hh centred on `from`. */
function exit(from: Point, to: Point, hw: number, hh: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return { x: from.x + dx * t, y: from.y + dy * t };
}

/** Which pass a hover explains: forward reads predecessors' EF, backward successors' LS. */
type Pass = "forward" | "backward";

export interface NetworkProps {
  tasks: Task[];
  result: CpmResult;
  reveal: Reveal;
  /** Ripple progress (0..1) of the forward and backward passes. */
  forward: MotionValue<number>;
  backward: MotionValue<number>;
  width: number;
  height: number;
  selected: string | null;
  /** Present only when nodes are selectable. */
  onSelect?: (id: string) => void;
}

export function Network({
  tasks,
  result,
  reveal,
  forward,
  backward,
  width,
  height,
  selected,
  onSelect,
}: NetworkProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const m = metrics(width, height);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const lit = reveal === "all";
  const pass: Pass | null = reveal === "forward" || reveal === "backward" ? reveal : null;
  // The backward pass reads successors; every other view shows what a task waits for.
  const related = new Set(
    hovered ? ((pass === "backward" ? SUCCESSORS.get(hovered) : byId.get(hovered)?.deps) ?? []) : [],
  );
  const arrow = m.compact ? 4 : 6;

  return (
    <div className="absolute inset-x-0 top-0" style={{ height }}>
      <svg width={width} height={height} className="absolute inset-0 overflow-visible" aria-hidden>
        {tasks.flatMap((to) =>
          to.deps.map((fromId) => {
            const from = byId.get(fromId)!;
            const a = center(from, m);
            const b = center(to, m);
            const start = exit(a, b, m.nodeW / 2 + 2, m.nodeH / 2 + 2);
            const tip = exit(b, a, m.nodeW / 2 + 3, m.nodeH / 2 + 3);
            const len = Math.hypot(tip.x - start.x, tip.y - start.y);
            const ux = (tip.x - start.x) / len;
            const uy = (tip.y - start.y) / len;
            const baseX = tip.x - ux * arrow * 1.6;
            const baseY = tip.y - uy * arrow * 1.6;
            const critical =
              lit && result.rows[to.id].critical && result.rows[from.id].critical &&
              result.rows[to.id].es === result.rows[from.id].ef;
            const highlighted = pass === "backward" ? hovered === fromId : hovered === to.id;
            return (
              <Edge
                key={`${fromId}-${to.id}`}
                edgeId={`${fromId}${to.id}`}
                line={`M ${start.x} ${start.y} L ${baseX} ${baseY}`}
                head={`M ${tip.x} ${tip.y} L ${baseX - uy * arrow} ${baseY + ux * arrow} L ${baseX + uy * arrow} ${baseY - ux * arrow} Z`}
                critical={critical}
                merge={to.deps.length > 1}
                highlighted={highlighted}
                dimmed={hovered !== null && !highlighted}
              />
            );
          }),
        )}
      </svg>

      {tasks.map((task) => {
        const c = center(task, m);
        const row = result.rows[task.id];
        return (
          <Node
            key={task.id}
            task={task}
            row={row}
            m={m}
            x={c.x - m.nodeW / 2}
            y={c.y - m.nodeH / 2}
            rank={result.order.indexOf(task.id)}
            count={result.order.length}
            forward={forward}
            backward={backward}
            lit={lit}
            dimmed={hovered !== null && hovered !== task.id && !related.has(task.id)}
            related={related.has(task.id)}
            pass={pass}
            hinted={hovered === task.id && pass !== null && related.size > 0}
            selected={selected === task.id}
            onSelect={onSelect}
            onHover={setHovered}
          />
        );
      })}
    </div>
  );
}

interface EdgeProps {
  edgeId: string;
  /** Path data for the shaft and the arrowhead. */
  line: string;
  head: string;
  critical: boolean;
  /** The edge feeds a task with more than one input. */
  merge: boolean;
  highlighted: boolean;
  dimmed: boolean;
}

/** One dependency arrow. The spotlight sits on the group so the paths keep their own fade. */
function Edge({ edgeId, line, head, critical, merge, highlighted, dimmed }: EdgeProps) {
  const spot = useSpots(["arrow", ...(merge ? ["merge"] : []), ...(critical ? ["critical-path"] : [])]);
  const tone = highlighted ? "stroke-fg fill-fg" : critical ? "stroke-accent fill-accent" : "stroke-muted fill-muted";
  const strokeWidth = (critical ? 3.5 : 1.5) + (highlighted ? 1 : 0);
  return (
    <g {...spot} data-edge={edgeId} data-critical={critical} className={`transition-colors ${tone}`}>
      {/* Stroke width snaps: only path data and opacity animate. */}
      <motion.path
        initial={false}
        animate={{ d: line, opacity: dimmed ? 0.25 : 1 }}
        transition={TRANSITION}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <motion.path
        initial={false}
        animate={{ d: head, opacity: dimmed ? 0.25 : 1 }}
        transition={TRANSITION}
        stroke="none"
      />
    </g>
  );
}

interface NodeProps {
  task: Task;
  row: TaskTimes;
  m: Metrics;
  x: number;
  y: number;
  /** Position in topological order; the backward pass walks it in reverse. */
  rank: number;
  count: number;
  forward: MotionValue<number>;
  backward: MotionValue<number>;
  lit: boolean;
  dimmed: boolean;
  /** A neighbour the hovered node reads from: what it waits for, or its successor in the backward pass. */
  related: boolean;
  /** The pass on screen, if any; it decides which value of a related node is ringed. */
  pass: Pass | null;
  /** Show this node's `max {es}` or `min {lf}` label. */
  hinted: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  onHover: (id: string | null) => void;
}

function Node({
  task,
  row,
  m,
  x,
  y,
  rank,
  count,
  forward,
  backward,
  lit,
  dimmed,
  related,
  pass,
  hinted,
  selected,
  onSelect,
  onHover,
}: NodeProps) {
  const f = rank / count;
  const b = (count - 1 - rank) / count;
  const step = 1 / count;
  const earliest = useTransform(forward, [f, f + step / 2], [0, 1]);
  const latest = useTransform(backward, [b, b + step / 2], [0, 1]);
  const forwardPulse = useTransform(forward, [f, f + step / 2, f + step], [0, 1, 0]);
  const backwardPulse = useTransform(backward, [b, b + step / 2, b + step], [0, 1, 0]);
  const pulse = useTransform(() => Math.max(forwardPulse.get(), backwardPulse.get()));

  const critical = lit && row.critical;
  const esEfSpot = useSpot("es-ef");
  const lsLfSpot = useSpot("ls-lf");
  const floatSpot = useSpot("float");
  const nodeSpot = useSpots([
    "task",
    ...(task.deps.length > 1 ? ["merge"] : []),
    ...(critical ? ["critical-path"] : []),
  ]);
  const ringEf = related && pass === "forward";
  const ringLs = related && pass === "backward";
  const numberRow = `absolute inset-x-0 flex justify-between px-1 tabular-nums ${m.compact ? "text-[9px] leading-[9px]" : "text-xs leading-4"}`;
  const hintClass = "absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-surface px-1 font-semibold text-fg";
  const detailsId = useId();
  // The button's name is its visible text (id, weeks, name); the rest is its description.
  const details = [
    task.deps.length ? `waits for ${task.deps.join(" and ")}` : "starts first",
    lit ? `start week ${row.es}, latest start week ${row.ls}, float ${weeks(row.float)}${row.critical ? ", critical" : ""}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.div
      data-node={task.id}
      className="absolute top-0 left-0"
      style={{ width: m.nodeW, height: m.nodeH }}
      initial={false}
      animate={{ x, y, opacity: dimmed ? 0.35 : 1 }}
      transition={TRANSITION}
    >
      {m.numbers && (
        <motion.div aria-hidden data-earliest style={{ opacity: earliest }} className={`${numberRow} bottom-full mb-0.5 text-fg`}>
          {/* Tagged inside the row: the row's reveal opacity is inline and would beat the spotlight. */}
          <span {...esEfSpot}>{row.es}</span>
          <span {...esEfSpot} data-emphasis={ringEf || undefined} className={ringEf ? EMPHASIS : undefined}>
            {row.ef}
          </span>
          {hinted && pass === "forward" && (
            <motion.span
              data-hint
              className={`${hintClass} bottom-full mb-0.5`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={FADE}
            >
              max {row.es}
            </motion.span>
          )}
        </motion.div>
      )}
      <motion.span
        aria-hidden
        style={{ opacity: pulse }}
        className="pointer-events-none absolute -inset-1 rounded-[0.6rem] border-2 border-accent"
      />
      <button
        type="button"
        {...nodeSpot}
        aria-describedby={detailsId}
        aria-pressed={onSelect ? selected : undefined}
        onClick={onSelect ? () => onSelect(task.id) : undefined}
        onPointerEnter={() => onHover(task.id)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(task.id)}
        onBlur={() => onHover(null)}
        className={`relative flex size-full flex-col justify-center overflow-hidden rounded-md border text-left ${m.compact ? "px-1.5" : "px-2.5"} transition-[background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          critical ? "border-accent bg-accent-soft" : "border-line bg-surface-2"
        } ${related ? "ring-2 ring-fg" : critical ? "ring-2 ring-accent" : ""} ${selected && onSelect ? "outline-2 outline-offset-2 outline-dashed outline-fg" : ""} ${onSelect ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className={`flex items-baseline justify-between gap-1 ${m.compact ? "text-[11px] leading-none" : "text-sm"}`}>
          <span className={`font-semibold ${critical ? "text-accent" : "text-fg"}`}>{task.id}</span>
          <span className="tabular-nums text-muted">
            <span aria-hidden>{task.weeks}w</span>
            <span className="sr-only">{weeks(task.weeks)},</span>
          </span>
        </span>
        <span className={m.compact ? "sr-only" : "truncate text-[11px] text-muted"}>{task.name}</span>
      </button>
      <span id={detailsId} className="sr-only">
        {details}
      </span>
      <motion.span
        aria-hidden
        style={{ scaleX: latest }}
        className="pointer-events-none absolute inset-x-2 top-full -mt-0.5 h-1 origin-left"
      >
        <motion.span
          {...floatSpot}
          data-float-bar={row.float}
          className="block h-full origin-left rounded-full bg-float"
          initial={false}
          animate={{ scaleX: Math.min(row.float / FLOAT_FULL, 1) }}
          transition={TRANSITION}
        />
      </motion.span>
      {m.numbers && (
        <motion.div aria-hidden data-latest style={{ opacity: latest }} className={`${numberRow} top-full mt-1 text-muted`}>
          <span {...lsLfSpot} data-emphasis={ringLs || undefined} className={ringLs ? EMPHASIS : undefined}>
            {row.ls}
          </span>
          <span {...lsLfSpot}>{row.lf}</span>
          {hinted && pass === "backward" && (
            <motion.span
              data-hint
              className={`${hintClass} top-full mt-0.5`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={FADE}
            >
              min {row.lf}
            </motion.span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
