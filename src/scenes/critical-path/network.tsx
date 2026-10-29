"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useId, useState } from "react";
import type { CpmResult, Task, TaskTimes } from "@/engine/critical-path/types";
import { TRANSITION } from "./motion";

export type Reveal = "none" | "forward" | "backward" | "all";

const COLS = 5;
const ROWS = 3;
/** Float that fills a node's float bar. */
const FLOAT_FULL = 6;

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
  const waitsFor = new Set(hovered ? byId.get(hovered)?.deps : []);
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
            const highlighted = hovered === to.id;
            const dimmed = hovered !== null && !highlighted;
            const tone = highlighted ? "stroke-fg fill-fg" : critical ? "stroke-accent fill-accent" : "stroke-muted fill-muted";
            const strokeWidth = (critical ? 3.5 : 1.5) + (highlighted ? 1 : 0);
            return (
              <g key={`${fromId}-${to.id}`} data-edge={`${fromId}${to.id}`} data-critical={critical} className={`transition-colors ${tone}`}>
                <motion.path
                  initial={false}
                  animate={{
                    d: `M ${start.x} ${start.y} L ${baseX} ${baseY}`,
                    strokeWidth,
                    opacity: dimmed ? 0.25 : 1,
                  }}
                  transition={TRANSITION}
                  fill="none"
                />
                <motion.path
                  initial={false}
                  animate={{
                    d: `M ${tip.x} ${tip.y} L ${baseX - uy * arrow} ${baseY + ux * arrow} L ${baseX + uy * arrow} ${baseY - ux * arrow} Z`,
                    opacity: dimmed ? 0.25 : 1,
                  }}
                  transition={TRANSITION}
                  stroke="none"
                />
              </g>
            );
          }),
        )}
      </svg>

      {tasks.map((task) => {
        const c = center(task, m);
        return (
          <Node
            key={task.id}
            task={task}
            row={result.rows[task.id]}
            m={m}
            x={c.x - m.nodeW / 2}
            y={c.y - m.nodeH / 2}
            rank={result.order.indexOf(task.id)}
            count={result.order.length}
            forward={forward}
            backward={backward}
            lit={lit}
            dimmed={hovered !== null && hovered !== task.id && !waitsFor.has(task.id)}
            waitedOn={waitsFor.has(task.id)}
            selected={selected === task.id}
            onSelect={onSelect}
            onHover={setHovered}
          />
        );
      })}
    </div>
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
  waitedOn: boolean;
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
  waitedOn,
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
  const numberRow = `absolute inset-x-0 flex justify-between px-1 tabular-nums ${m.compact ? "text-[9px] leading-[9px]" : "text-xs leading-4"}`;
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
          <span>{row.es}</span>
          <span>{row.ef}</span>
        </motion.div>
      )}
      <motion.span
        aria-hidden
        style={{ opacity: pulse }}
        className="pointer-events-none absolute -inset-1 rounded-[0.6rem] border-2 border-accent"
      />
      <button
        type="button"
        aria-describedby={detailsId}
        aria-pressed={onSelect ? selected : undefined}
        onClick={onSelect ? () => onSelect(task.id) : undefined}
        onPointerEnter={() => onHover(task.id)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(task.id)}
        onBlur={() => onHover(null)}
        className={`relative flex size-full flex-col justify-center overflow-hidden rounded-md border text-left ${m.compact ? "px-1.5" : "px-2.5"} transition-[background-color,border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          critical ? "border-accent bg-accent-soft" : "border-line bg-surface-2"
        } ${waitedOn ? "ring-2 ring-fg" : critical ? "ring-2 ring-accent" : ""} ${selected && onSelect ? "outline-2 outline-offset-2 outline-dashed outline-fg" : ""} ${onSelect ? "cursor-pointer" : "cursor-default"}`}
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
          data-float-bar={row.float}
          className="block h-full origin-left rounded-full bg-float"
          initial={false}
          animate={{ scaleX: Math.min(row.float / FLOAT_FULL, 1) }}
          transition={TRANSITION}
        />
      </motion.span>
      {m.numbers && (
        <motion.div aria-hidden data-latest style={{ opacity: latest }} className={`${numberRow} top-full mt-1 text-muted`}>
          <span>{row.ls}</span>
          <span>{row.lf}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
