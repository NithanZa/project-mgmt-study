"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useSpot } from "@/components/lesson/spotlight";
import { FADE } from "@/components/transitions";
import type { Placement, Schedule, Task } from "@/engine/rcpsp/types";
import { AXIS_DAYS, atDay } from "./timeline";

const TICKS = Array.from({ length: AXIS_DAYS / 5 + 1 }, (_, i) => i * 5);
/** Grid rows: the rank header, then one per task, then the day axis. */
const HEADER_ROW = 1;
const FIRST_TASK_ROW = 2;

/** Bar height shows how many people a task ties up; colour shows which kind. */
function barStyle(task: Task): { className: string; height: string } {
  const programmers = task.needs.programmer ?? 0;
  const artists = task.needs.artist ?? 0;
  const height = programmers + artists > 1 ? "76%" : "40%";
  if (programmers && artists) {
    return { className: "bg-[linear-gradient(var(--accent)_50%,var(--float)_50%)]", height };
  }
  return { className: programmers ? "bg-accent" : "bg-float", height };
}

export interface RankColumn {
  header: string;
  /** One value per task, in task-list order. */
  values: number[];
  /** The task the rule picks first. */
  first: string;
}

export interface GanttRowsProps {
  tasks: Task[];
  schedule: Schedule;
  span: number;
  /** Tasks not yet placed: drawn as faint outlines where `schedule` puts them. */
  pending?: ReadonlySet<string>;
  /** The selected rule's rank column; null hides it but keeps its width. */
  rank: RankColumn | null;
}

/** Rank header, seven task rows and the day axis; cells for a two-column parent grid. */
export function GanttRows({ tasks, schedule, span, pending, rank }: GanttRowsProps) {
  const [hover, setHover] = useState<string | null>(null);
  const hovered = tasks.find((t) => t.id === hover);
  const bright = hovered ? new Set([hovered.id, ...hovered.deps]) : null;
  const rankSpot = useSpot("rank");
  const axisRow = FIRST_TASK_ROW + tasks.length;

  return (
    <>
      <div className="relative h-4" style={{ gridRow: HEADER_ROW }}>
        <span {...rankSpot} className="absolute right-1 bottom-0.5 leading-none">
          <motion.span
            className="whitespace-nowrap text-muted"
            initial={false}
            animate={{ opacity: rank ? 1 : 0 }}
            transition={FADE}
          >
            {rank?.header}
          </motion.span>
        </span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none relative col-start-2"
        style={{ gridRowStart: FIRST_TASK_ROW, gridRowEnd: axisRow }}
      >
        {TICKS.map((d) => (
          <div key={d} className="absolute inset-y-0 border-l border-line" style={{ left: atDay(d) }} />
        ))}
        <motion.div
          layout
          data-span={span}
          className="absolute inset-y-0 z-10 border-l-2 border-dashed border-fg"
          style={{ left: atDay(span) }}
        />
      </div>
      {tasks.map((task, i) => (
        <Row
          key={task.id}
          task={task}
          row={FIRST_TASK_ROW + i}
          placement={schedule[i]}
          pending={pending?.has(task.id) ?? false}
          rank={rank ? { value: rank.values[i], first: rank.first === task.id } : null}
          rankSpot={rankSpot}
          dim={bright !== null && !bright.has(task.id)}
          onHover={(on) => setHover((h) => (on ? task.id : h === task.id ? null : h))}
        />
      ))}
      <div className="relative col-start-2 h-4 tabular-nums text-muted" style={{ gridRow: axisRow }}>
        {TICKS.map((d) => (
          <span key={d} className="absolute top-0.5 -translate-x-1/2 leading-none" style={{ left: atDay(d) }}>
            {d}
          </span>
        ))}
        <motion.span
          layout
          className="absolute top-0.5 z-10 -translate-x-1/2 rounded-sm bg-fg px-1 font-semibold leading-none text-surface"
          style={{ left: atDay(span) }}
        >
          {span}
        </motion.span>
      </div>
    </>
  );
}

interface RowProps {
  task: Task;
  row: number;
  placement: Placement;
  pending: boolean;
  rank: { value: number; first: boolean } | null;
  rankSpot: ReturnType<typeof useSpot>;
  /** Another row is hovered and this one is not it or one of its dependencies. */
  dim: boolean;
  onHover: (on: boolean) => void;
}

/**
 * One task: its label (focus or hover it to keep only it and its dependencies
 * bright), rank value and bar. Spotlight tags sit on inner wrappers so the
 * hover dimming on the cells never hides a lit element's own fade.
 */
function Row({ task, row, placement, pending, rank, rankSpot, dim, onHover }: RowProps) {
  const rowSpot = useSpot(task.deps.length ? "deps" : "task");
  const { className, height } = barStyle(task);
  const fade = `transition-opacity duration-180 ease-out ${dim ? "opacity-30" : ""}`;
  const after = task.deps.length ? `, after ${task.deps.join(" and ")}` : "";
  const ranked = rank ? `, rank ${rank.value}` : "";

  return (
    <>
      <div
        role="group"
        tabIndex={0}
        aria-label={`${task.id} ${task.name}${after}${ranked}`}
        data-row={task.id}
        className={`flex min-w-0 items-center gap-1.5 rounded-sm pr-1 outline-none focus-visible:outline-2 focus-visible:outline-accent ${fade}`}
        style={{ gridRow: row }}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
      >
        <span {...rowSpot} className="flex min-w-0 items-center gap-1.5">
          <span className="font-semibold text-fg">{task.id}</span>
          <span className="hidden truncate text-muted sm:inline">{task.name}</span>
        </span>
        <span {...rankSpot} data-rank={rank?.value} data-first={rank?.first || undefined} className="ml-auto">
          <motion.span
            className={`block min-w-[3ch] rounded-sm px-0.5 text-right tabular-nums leading-tight text-fg ${rank?.first ? "outline-1 outline-accent outline-solid" : ""}`}
            initial={false}
            animate={{ opacity: rank ? 1 : 0 }}
            transition={FADE}
          >
            {rank?.value}
          </motion.span>
        </span>
      </div>
      <div
        data-task={task.id}
        data-start={placement.start}
        data-pending={pending || undefined}
        className={`relative flex items-center ${fade}`}
        style={{ gridRow: row, gridColumn: 2 }}
      >
        <div {...rowSpot} className="absolute inset-0 flex items-center">
          <motion.div
            layout
            className={`absolute ${pending ? "border border-dashed border-muted" : className}`}
            style={{
              left: atDay(placement.start),
              width: atDay(task.days),
              height,
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </>
  );
}
