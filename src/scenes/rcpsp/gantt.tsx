"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import type { Schedule, Task } from "@/engine/rcpsp/types";
import { AXIS_DAYS, atDay } from "./timeline";

const TICKS = Array.from({ length: AXIS_DAYS / 5 + 1 }, (_, i) => i * 5);

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

/** Seven task rows and the day axis; cells for a two-column parent grid. */
export function GanttRows({ tasks, schedule, span }: { tasks: Task[]; schedule: Schedule; span: number }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none relative col-start-2 row-start-1 row-end-8">
        {TICKS.map((d) => (
          <div key={d} className="absolute inset-y-0 border-l border-line" style={{ left: atDay(d) }} />
        ))}
        <motion.div
          layout
          className="absolute inset-y-0 z-10 border-l-2 border-dashed border-fg"
          style={{ left: atDay(span) }}
        />
      </div>
      {tasks.map((task, i) => {
        const { className, height } = barStyle(task);
        return (
          <Fragment key={task.id}>
            <div className="flex min-w-0 items-center gap-1.5 pr-1" style={{ gridRow: i + 1 }}>
              <span className="font-semibold text-fg">{task.id}</span>
              <span className="hidden truncate text-muted sm:inline">{task.name}</span>
            </div>
            <div className="relative flex items-center" style={{ gridRow: i + 1, gridColumn: 2 }}>
              <motion.div
                layout
                className={`absolute ${className}`}
                style={{
                  left: atDay(schedule[i].start),
                  width: atDay(task.days),
                  height,
                  borderRadius: 4,
                }}
              />
            </div>
          </Fragment>
        );
      })}
      <div className="relative col-start-2 h-4 tabular-nums text-muted" style={{ gridRow: 8 }}>
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
