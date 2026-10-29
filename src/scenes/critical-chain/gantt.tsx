"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useRef } from "react";
import type { Clash } from "@/engine/critical-chain/schedule";
import type { Buffers, Chain, Link, ResourceId, Schedule, Task } from "@/engine/critical-chain/types";
import { FADE, MOVE } from "./motion";
import { useSize } from "./use-size";

export const AXIS_DAYS = 30;
const TICKS = [0, 5, 10, 15, 20, 25, 30];
const CHAIN_THICKNESS = 0.62;
const OTHER_THICKNESS = 0.4;

const pct = (days: number) => `${(days / AXIS_DAYS) * 100}%`;

export interface GanttProps {
  tasks: Task[];
  schedule: Schedule;
  chain: Chain;
  /** Float to draw after each task, in days (0 hides it). */
  float: Record<string, number>;
  buffers: Buffers;
  showBuffers: boolean;
  /** Days of the project buffer already consumed. */
  consumed: number;
  clashes: Clash[];
  lane: ResourceId;
  laneLabel: string;
  /** Day marked as the finish / committed date. */
  finish: number;
}

/** Vertical placement of a band inside row `i` of `n`, `thickness` as a share of the row. */
function band(i: number, n: number, thickness: number) {
  return {
    top: `${((i + (1 - thickness) / 2) / n) * 100}%`,
    height: `${(thickness / n) * 100}%`,
  };
}

export function Gantt(props: GanttProps) {
  const { tasks, schedule, chain, float, buffers, showBuffers, consumed, finish } = props;
  const n = tasks.length;
  const onChain = new Set(chain.ids);
  const row = (id: string) => tasks.findIndex((t) => t.id === id);
  const end = schedule.makespan;
  const project = buffers.project.days;

  return (
    <div className="grid h-full min-h-0 grid-cols-[auto_1fr] grid-rows-[1fr_auto_auto] gap-x-2 gap-y-1.5">
      <div className="grid" style={{ gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-end">
            <span
              className={`text-xs leading-none ${onChain.has(t.id) ? "font-semibold text-fg" : "text-muted"}`}
            >
              {t.name}
            </span>
          </div>
        ))}
      </div>

      <div className="relative min-h-0">
        {TICKS.map((d) => (
          <div
            key={d}
            aria-hidden
            className="absolute inset-y-0 border-l border-line"
            style={{ left: pct(d) }}
          />
        ))}

        {tasks.map((t, i) => {
          const critical = onChain.has(t.id);
          const thick = critical ? CHAIN_THICKNESS : OTHER_THICKNESS;
          const start = schedule.start[t.id];
          // The bar spans the scheduled duration; the core marks the 50% estimate inside it.
          const outer = schedule.finish[t.id] - start;
          const core = Math.min(t.aggressive, outer);
          const place = band(i, n, thick);
          return [
            <motion.div
              key={`${t.id}-outer`}
              data-outer={t.id}
              layout
              transition={MOVE}
              className={`absolute rounded-[0.3rem] border ${critical ? "border-accent/60 bg-accent-soft" : "border-line bg-surface-2"}`}
              style={{ ...place, left: pct(start), width: pct(outer) }}
            />,
            <motion.div
              key={`${t.id}-core`}
              data-bar={t.id}
              layout
              transition={MOVE}
              className={`absolute rounded-[0.3rem] ${critical ? "bg-accent" : "bg-muted/60"}`}
              style={{ ...place, left: pct(start), width: pct(core) }}
            />,
          ];
        })}

        {tasks.map((t, i) => {
          const days = float[t.id] ?? 0;
          const at = schedule.finish[t.id];
          return [
            <motion.div
              key={`${t.id}-float`}
              layout
              transition={MOVE}
              aria-hidden
              className="absolute border-x-2 border-float"
              animate={{ opacity: days > 0 ? 1 : 0 }}
              style={{ ...band(i, n, 0.3), left: pct(at), width: pct(days) }}
            >
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-float" />
            </motion.div>,
            <Tag
              key={`${t.id}-float-label`}
              at={at + days / 2}
              row={i}
              n={n}
              visible={days > 0}
              className="text-float"
              offset={-0.42}
            >
              {days}
            </Tag>,
          ];
        })}

        {buffers.feeding.map((f) => {
          const at = schedule.start[f.before];
          const days = showBuffers ? f.days : 0;
          const i = row(f.from);
          return [
            <motion.div
              key={`${f.from}-feeding`}
              data-buffer="feeding"
              layout
              transition={MOVE}
              className="absolute rounded-[0.3rem] border border-buffer bg-buffer/25"
              animate={{ opacity: showBuffers ? 1 : 0 }}
              style={{ ...band(i, n, OTHER_THICKNESS), left: pct(at - days), width: pct(days) }}
            />,
            <Tag
              key={`${f.from}-feeding-label`}
              at={at - days / 2}
              row={i}
              n={n}
              visible={showBuffers}
              className="text-buffer"
              offset={-0.42}
            >
              {f.days}
            </Tag>,
          ];
        })}

        <motion.div
          data-buffer="project"
          layout
          transition={MOVE}
          className="absolute rounded-[0.3rem] border border-buffer bg-buffer/25"
          animate={{ opacity: showBuffers ? 1 : 0 }}
          style={{
            ...band(row(chain.ids[chain.ids.length - 1]), n, CHAIN_THICKNESS),
            left: pct(end),
            width: pct(showBuffers ? project : 0),
          }}
        />
        <motion.div
          layout
          transition={MOVE}
          aria-hidden
          className="hatch absolute rounded-l-[0.3rem] text-constraint"
          animate={{ opacity: showBuffers && consumed > 0 ? 1 : 0 }}
          style={{
            ...band(row(chain.ids[chain.ids.length - 1]), n, CHAIN_THICKNESS),
            left: pct(end),
            width: pct(showBuffers ? Math.min(consumed, project) : 0),
          }}
        />
        <Tag
          at={end + project / 2}
          row={row(chain.ids[chain.ids.length - 1])}
          n={n}
          visible={showBuffers}
          className="text-buffer"
          offset={-0.5}
        >
          {project}
        </Tag>

        <motion.div
          layout
          transition={MOVE}
          aria-hidden
          className="absolute inset-y-0 w-0 border-l-2 border-dashed border-accent"
          style={{ left: pct(finish) }}
        />

        <Arrows {...props} />
      </div>

      <div className="flex items-center justify-end text-xs text-muted">{props.laneLabel}</div>
      <Lane {...props} />

      <div className="text-right text-[0.65rem] leading-4 text-muted">day</div>
      <div className="relative h-4">
        {TICKS.map((d) => (
          <motion.span
            key={d}
            data-tick={d}
            animate={{ opacity: Math.abs(d - finish) < 2 ? 0 : 1 }}
            transition={FADE}
            className="absolute w-6 -translate-x-1/2 text-center text-[0.65rem] leading-4 tabular-nums text-muted"
            style={{ left: pct(d) }}
          >
            {d}
          </motion.span>
        ))}
        <motion.span
          layout
          transition={MOVE}
          className="absolute -ml-4 w-8 rounded-sm bg-accent text-center text-[0.7rem] font-semibold leading-4 tabular-nums text-surface"
          style={{ left: pct(finish) }}
        >
          {finish}
        </motion.span>
      </div>
    </div>
  );
}

function Tag({
  at,
  row,
  n,
  visible,
  offset,
  className,
  children,
}: {
  at: number;
  row: number;
  n: number;
  visible: boolean;
  /** Vertical shift from the row centre, as a share of the row. */
  offset: number;
  className: string;
  children: number;
}) {
  return (
    <motion.span
      layout="position"
      transition={MOVE}
      aria-hidden
      animate={{ opacity: visible ? 1 : 0 }}
      className={`absolute -ml-4 w-8 -translate-y-1/2 text-center text-[0.65rem] font-semibold leading-none tabular-nums ${className}`}
      style={{ left: pct(at), top: `${((row + 0.5 + offset) / n) * 100}%` }}
    >
      {children}
    </motion.span>
  );
}

function Lane({ tasks, schedule, clashes, lane }: GanttProps) {
  const mine = tasks.filter((t) => t.resource === lane);
  return (
    <div className="relative h-4 rounded-sm bg-surface-2">
      {mine.map((t) => (
        <motion.div
          key={t.id}
          layout
          transition={MOVE}
          className="absolute inset-y-0.5 rounded-[0.2rem] bg-muted/45"
          style={{ left: pct(schedule.start[t.id]), width: pct(schedule.finish[t.id] - schedule.start[t.id]) }}
        />
      ))}
      <AnimatePresence initial={false}>
        {clashes
          .filter((c) => c.resource === lane)
          .map((c) => (
            <motion.div
              key={`${c.from}-${c.to}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="hatch absolute inset-y-0 rounded-[0.2rem] border border-constraint text-constraint"
              style={{ left: pct(c.from), width: pct(c.to - c.from) }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

function Arrows({ tasks, schedule, chain, buffers, showBuffers }: GanttProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(ref);
  const id = useId();
  const n = tasks.length;
  const x = (days: number) => (days / AXIS_DAYS) * width;
  const y = (taskId: string) => ((tasks.findIndex((t) => t.id === taskId) + 0.5) / n) * height;
  const onChain = (l: Link) => chain.links.some((c) => c.from === l.from && c.to === l.to);

  const dependencies: Link[] = tasks.flatMap((t) =>
    t.deps.map((d) => ({ from: d, to: t.id, kind: "dependency" as const })),
  );
  const resources = chain.links.filter((l) => l.kind === "resource");

  const path = (l: Link) => {
    const feeding = buffers.feeding.find((f) => f.from === l.from && f.before === l.to);
    const fromDay =
      feeding && showBuffers ? schedule.start[l.to] : schedule.finish[l.from];
    const [x1, y1, x2, y2] = [x(fromDay), y(l.from), x(schedule.start[l.to]) - 1, y(l.to)];
    const k = Math.max(10, Math.abs(x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + k} ${y1} ${x2 - k} ${y2} ${x2} ${y2}`;
  };

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0 overflow-visible">
          <defs>
            {(["accent", "muted"] as const).map((c) => (
              <marker
                key={c}
                id={`${id}-${c}`}
                viewBox="0 0 6 6"
                refX="5"
                refY="3"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L6 3 L0 6 z" fill={`var(--${c})`} />
              </marker>
            ))}
          </defs>
          {dependencies.map((l) => {
            const critical = onChain(l);
            return (
              <motion.path
                key={`${l.from}-${l.to}`}
                initial={false}
                animate={{ d: path(l) }}
                transition={MOVE}
                fill="none"
                strokeWidth={critical ? 1.75 : 1.25}
                className={critical ? "stroke-accent" : "stroke-muted"}
                markerEnd={`url(#${id}-${critical ? "accent" : "muted"})`}
              />
            );
          })}
          <AnimatePresence initial={false}>
            {resources.map((l) => (
              <motion.path
                key={`${l.from}-${l.to}-resource`}
                initial={{ opacity: 0, d: path(l) }}
                animate={{ opacity: 1, d: path(l) }}
                exit={{ opacity: 0 }}
                transition={MOVE}
                fill="none"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                className="stroke-accent"
                markerEnd={`url(#${id}-accent)`}
              />
            ))}
          </AnimatePresence>
        </svg>
      )}
    </div>
  );
}
