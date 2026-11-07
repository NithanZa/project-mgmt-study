"use client";

import { motion } from "motion/react";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { useSpot, useSpots } from "@/components/lesson/spotlight";
import type { CpmRow } from "@/engine/resource-leveling/cpm";
import type { Resource, Rule, Schedule, Task } from "@/engine/resource-leveling/types";
import type { Geometry } from "./geometry";

export const BAR_CLASS: Record<Resource, string> = {
  designer: "fill-accent/20 stroke-accent",
  developer: "fill-float/20 stroke-float",
};

const FADE = { duration: 0.18, ease: "easeOut" } as const;
const RANK_HEADER: Record<Rule, string> = { "min-lst": "LST", shortest: "days" };

export interface GanttProps {
  tasks: Task[];
  schedule: Schedule;
  geo: Geometry;
  /** CPM rows: float windows, float numbers and latest starts. */
  rows: Record<string, CpmRow>;
  /** Draw the CPM float windows behind bars. */
  showGhosts: boolean;
  /** Print each window's float at its right end. */
  showFloat: boolean;
  /** Booking sequence behind the badges. */
  order: readonly string[];
  showOrder: boolean;
  /** Rule whose rank fills the column beside the labels. */
  rank: Rule;
  /** Show the rank column and outline the task booked first. */
  showRank: boolean;
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

/**
 * Bars over CPM float windows. Spotlight tags sit on groups outside every opacity fade,
 * because Motion's inline opacity would beat the spotlight's dimming, and no tagged
 * group is nested in another.
 */
export function Gantt({
  tasks,
  schedule,
  geo,
  rows,
  showGhosts,
  showFloat,
  order,
  showOrder,
  rank,
  showRank,
  flagged,
  maxStart,
  onMove,
}: GanttProps) {
  const drag = useRef<Drag | null>(null);
  const { x0, dayW, barH, font } = geo;
  const floatSpot = useSpot("float");
  const lstSpot = useSpot("lst");
  const orderSpot = useSpot("order");
  const firstSpot = useSpots(["lst", "order"]);
  const taskSpot = useSpot("task");
  const rankValue = (t: Task) => (rank === "min-lst" ? rows[t.id].ls : t.days);
  const badgeR = font * 0.62;

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
      {geo.rowLabels && (
        <g aria-hidden {...lstSpot}>
          <motion.text
            x={geo.rankX}
            y={geo.headY}
            textAnchor="middle"
            className="fill-muted"
            style={{ fontSize: font * 0.85 }}
            initial={false}
            animate={{ opacity: showRank ? 1 : 0 }}
            transition={FADE}
          >
            {RANK_HEADER[rank]}
          </motion.text>
        </g>
      )}

      {tasks.map((t) => {
        const y = geo.rowY[t.id];
        const row = rows[t.id];
        const ghost = showGhosts && row.float > 0;
        return (
          <g key={t.id} aria-hidden>
            {geo.rowLabels && (
              <>
                <g {...lstSpot} data-rank={showRank ? rankValue(t) : undefined}>
                  <motion.text
                    x={geo.rankX}
                    y={y + barH / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-fg font-medium tabular-nums"
                    style={{ fontSize: font * 0.95 }}
                    initial={false}
                    animate={{ opacity: showRank ? 1 : 0 }}
                    transition={FADE}
                  >
                    {rankValue(t)}
                  </motion.text>
                </g>
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
              </>
            )}
            <g {...floatSpot}>
              <motion.rect
                x={x0 + row.es * dayW}
                y={y}
                width={(row.lf - row.es) * dayW}
                height={barH}
                rx={4}
                strokeDasharray="3 3"
                className="fill-none stroke-muted"
                initial={false}
                animate={{ opacity: ghost ? 0.7 : 0 }}
                transition={FADE}
              />
              {row.float > 0 && (
                <motion.text
                  x={x0 + row.lf * dayW + font * 0.3}
                  y={y + barH / 2}
                  dominantBaseline="central"
                  className="fill-muted tabular-nums"
                  style={{ fontSize: font * 0.85 }}
                  data-float={ghost && showFloat ? row.float : undefined}
                  initial={false}
                  animate={{ opacity: ghost && showFloat ? 1 : 0 }}
                  transition={FADE}
                >
                  {row.float}d
                </motion.text>
              )}
            </g>
          </g>
        );
      })}

      {tasks.map((t) => {
        const { start } = schedule[t.id];
        const y = geo.rowY[t.id];
        const w = t.days * dayW;
        const isFlagged = flagged.includes(t.id);
        const booked = order.indexOf(t.id) + 1;
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
            <g {...taskSpot}>
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
            </g>
            <g
              {...firstSpot}
              className="pointer-events-none"
              data-first={showRank && order[0] === t.id ? "" : undefined}
            >
              <motion.rect
                x={-2}
                y={-3}
                width={w + 4}
                height={barH + 6}
                rx={6}
                strokeWidth={2}
                className="fill-none stroke-accent"
                initial={false}
                animate={{ opacity: showRank && order[0] === t.id ? 1 : 0 }}
                transition={FADE}
              />
            </g>
            {/* Too short for text means too short for a numbered badge. */}
            <g
              {...orderSpot}
              className="pointer-events-none"
              data-order={showOrder && geo.rowLabels ? booked : undefined}
            >
              <motion.g
                initial={false}
                animate={{ opacity: showOrder && geo.rowLabels ? 1 : 0 }}
                transition={FADE}
              >
                <circle cx={1} cy={0} r={badgeR} className="fill-fg" />
                <text
                  x={1}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-bg font-semibold tabular-nums"
                  style={{ fontSize: font * 0.72 }}
                >
                  {booked}
                </text>
              </motion.g>
            </g>
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
