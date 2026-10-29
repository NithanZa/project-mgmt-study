"use client";

import { motion } from "motion/react";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { CpmRow } from "@/engine/resource-leveling/cpm";
import type { Resource, Schedule, Task } from "@/engine/resource-leveling/types";
import type { Geometry } from "./geometry";

export const BAR_CLASS: Record<Resource, string> = {
  designer: "fill-accent/20 stroke-accent",
  developer: "fill-float/20 stroke-float",
};

const FADE = { duration: 0.18, ease: "easeOut" } as const;

export interface GanttProps {
  tasks: Task[];
  schedule: Schedule;
  geo: Geometry;
  /** CPM float windows to draw behind bars, or null to hide them. */
  ghosts: Record<string, CpmRow> | null;
  /** Tasks that ran out of float. */
  flagged: readonly string[];
  /** Latest start per task that keeps the plan on the axis. */
  maxStart: Record<string, number>;
  /** Present when bars are draggable: move `id` to `start`, pushing successors from `base`. */
  onMove?: (id: string, start: number, base: Schedule) => void;
}

interface Drag {
  id: string;
  x: number;
  start: number;
  delta: number;
  base: Schedule;
}

export function Gantt({ tasks, schedule, geo, ghosts, flagged, maxStart, onMove }: GanttProps) {
  const drag = useRef<Drag | null>(null);
  const { x0, dayW, barH, font } = geo;

  const onPointerDown = (e: PointerEvent<SVGGElement>, id: string) => {
    if (!onMove) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id, x: e.clientX, start: schedule[id].start, delta: 0, base: schedule };
  };

  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d || !onMove) return;
    const delta = Math.round((e.clientX - d.x) / dayW);
    if (delta === d.delta) return;
    d.delta = delta;
    onMove(d.id, d.start + delta, d.base);
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>, id: string) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!onMove || step === 0) return;
    e.preventDefault();
    onMove(id, schedule[id].start + step, schedule);
  };

  return (
    <g>
      {tasks.map((t) => {
        const y = geo.rowY[t.id];
        const row = ghosts?.[t.id];
        const showGhost = row !== undefined && row.float > 0;
        return (
          <g key={t.id} aria-hidden>
            {geo.rowLabels && (
              <text
                x={x0 - font * 0.6}
                y={y + barH / 2}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-muted"
                style={{ fontSize: font }}
              >
                {t.name}
              </text>
            )}
            <motion.rect
              x={x0 + (row?.es ?? 0) * dayW}
              y={y}
              width={(row ? row.lf - row.es : 0) * dayW}
              height={barH}
              rx={4}
              strokeDasharray="3 3"
              className="fill-none stroke-muted"
              initial={false}
              animate={{ opacity: showGhost ? 0.7 : 0 }}
              transition={FADE}
            />
          </g>
        );
      })}

      {tasks.map((t) => {
        const { start } = schedule[t.id];
        const y = geo.rowY[t.id];
        const w = t.days * dayW;
        const isFlagged = flagged.includes(t.id);
        const minStart = Math.max(0, ...t.deps.map((d) => schedule[d].end));
        const interactive = onMove
          ? {
              role: "slider",
              tabIndex: 0,
              "aria-label": `${t.id} ${t.name} start day`,
              "aria-valuemin": minStart,
              "aria-valuemax": maxStart[t.id],
              "aria-valuenow": start,
              "aria-valuetext": `day ${start}`,
              onPointerDown: (e: PointerEvent<SVGGElement>) => onPointerDown(e, t.id),
              onPointerMove,
              onPointerUp: () => (drag.current = null),
              onPointerCancel: () => (drag.current = null),
              onKeyDown: (e: KeyboardEvent<SVGGElement>) => onKeyDown(e, t.id),
            }
          : { "aria-hidden": true };
        return (
          <motion.g
            key={t.id}
            data-task={t.id}
            initial={false}
            animate={{ x: x0 + start * dayW, y }}
            className={`group outline-none ${onMove ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
            {...interactive}
          >
            <rect
              x={1}
              width={w - 2}
              height={barH}
              rx={4}
              strokeWidth={isFlagged ? 2 : 1.25}
              strokeDasharray={isFlagged ? "4 2" : undefined}
              className={isFlagged ? "fill-constraint/15 stroke-constraint" : BAR_CLASS[t.resource]}
            />
            {geo.rowLabels && (
              <text
                x={w / 2}
                y={barH / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className={`font-medium ${isFlagged ? "fill-constraint" : "fill-fg"}`}
                style={{ fontSize: font * 0.95 }}
              >
                {isFlagged ? `${t.id} !` : t.id}
              </text>
            )}
            <rect
              x={-1}
              y={-2}
              width={w + 2}
              height={barH + 4}
              rx={6}
              strokeWidth={2}
              className="pointer-events-none fill-none stroke-fg opacity-0 group-focus-visible:opacity-100"
            />
          </motion.g>
        );
      })}
    </g>
  );
}
