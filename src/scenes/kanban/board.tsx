"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Column } from "@/engine/kanban/flow";
import type { LineItem } from "@/lib/line-sim";

const SHOWN = 10;
const FADE = { duration: 0.18, ease: "easeOut" } as const;

export interface BoardProps {
  columns: Column[];
  limit?: number;
  items: LineItem[];
  tick: number;
  /** Milliseconds per day, so a card lands before the next move. */
  interval: number;
  className?: string;
}

export function Board({ columns, limit, items, tick, interval, className = "" }: BoardProps) {
  const move = { type: "spring", bounce: 0.2, visualDuration: Math.min(0.4, (interval * 0.8) / 1000) } as const;
  return (
    <div className={`grid min-h-0 grid-cols-4 gap-1.5 sm:gap-2.5 ${className}`}>
      {columns.map((col) => {
        const shown = Math.min(SHOWN, col.count);
        return (
          <div
            key={col.id}
            data-column={col.id}
            data-count={col.count}
            data-full={col.full}
            data-blocked={col.blocked}
            data-down={col.down}
            className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-line bg-surface-2/60"
          >
            <AnimatePresence>
              {col.down && (
                <motion.div
                  key="down"
                  aria-hidden
                  className="hatch pointer-events-none absolute inset-0 text-constraint/25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                />
              )}
            </AnimatePresence>
            <div className="relative flex flex-col gap-0.5 px-1 pt-1 sm:px-2 sm:pt-2">
              <span className="truncate text-[10px] leading-tight font-medium sm:text-sm">{col.name}</span>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] tabular-nums text-muted sm:text-xs">{col.capacity}/day</span>
                <LimitChip count={col.count} limit={limit} full={col.full} />
              </div>
            </div>
            <div className="relative mx-1 my-0.5 h-3.5 sm:mx-2 sm:my-1 sm:h-4">
              <AnimatePresence>
                {(col.blocked || col.down) && (
                  <motion.div
                    key={col.down ? "down" : "waiting"}
                    className={`hatch absolute inset-0 flex items-center justify-center rounded-sm border ${col.down ? "border-constraint/60 text-constraint" : "border-buffer/60 text-buffer"}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE}
                  >
                    <span className="rounded-sm bg-surface px-1 text-[9px] leading-3 font-medium sm:text-[10px]">
                      {col.down ? "down" : "waiting"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Cards sit at the origin and move to their slot (2 × 5) by transform only, so
                cards leaving and arriving never shift another card's layout box (CLS 0). */}
            <div className="relative mx-[3px] min-h-0 flex-1 overflow-hidden sm:mx-[5px]">
              {Array.from({ length: shown }, (_, k) => {
                const id = col.first + k;
                const entered = items[id].enteredTick;
                const slot = { x: `${(k % 2) * 100}%`, y: `${Math.floor(k / 2) * 100}%` };
                return (
                  <motion.div
                    key={id}
                    layoutId={`card-${id}`}
                    data-card={id}
                    className="absolute top-0 left-0 h-[clamp(0.75rem,20%,2.75rem)] w-1/2 p-px sm:p-[3px]"
                    initial={entered === tick ? { ...slot, opacity: 0 } : false}
                    animate={{ ...slot, opacity: 1 }}
                    transition={{ layout: move, x: move, y: move, opacity: FADE }}
                  >
                    <div className="flex size-full items-center justify-center rounded-[5px] border border-line bg-surface shadow-xs">
                      <span className="hidden text-[10px] tabular-nums text-muted sm:inline">{tick - entered}d</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="relative flex h-4 items-center justify-center gap-1 sm:h-6">
              {col.count > shown && (
                <>
                  <span aria-hidden className="hatch h-2 w-3 rounded-[2px] border border-constraint/70 text-constraint sm:h-3 sm:w-5" />
                  <span className="text-[10px] font-semibold tabular-nums text-constraint sm:text-xs">+{col.count - shown}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LimitChip({ count, limit, full }: { count: number; limit?: number; full: boolean }) {
  return (
    <span className="relative shrink-0 rounded-full border border-line bg-surface px-1 text-[9px] leading-3.5 font-semibold tabular-nums sm:px-1.5 sm:text-xs sm:leading-5">
      <motion.span
        aria-hidden
        className="absolute -inset-px rounded-full bg-constraint"
        initial={false}
        animate={{ opacity: full ? 1 : 0 }}
        transition={FADE}
      />
      <span data-chip className={`relative ${full ? "text-surface" : "text-fg"}`}>
        {limit === undefined ? count : `${count}/${limit}`}
      </span>
    </span>
  );
}
