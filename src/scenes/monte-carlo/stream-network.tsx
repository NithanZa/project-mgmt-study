"use client";

import { AnimatePresence, motion } from "motion/react";
import { PREP } from "@/engine/monte-carlo/fixture";
import type { Estimate, RunSample, Stream } from "@/engine/monte-carlo/types";
import { FADE, MOTION } from "./scale";

const range = ({ o, m, p }: Estimate) => `${o}–${m}–${p}`;

function TaskBox({ estimate, value, critical }: { estimate: Estimate; value?: number; critical: boolean }) {
  return (
    <div
      className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-[0.4rem] leading-none tabular-nums lg:rounded-md ${
        critical ? "border-2 border-accent bg-accent-soft" : "border border-line bg-surface-2"
      }`}
    >
      <span
        className={`text-[9px] text-muted lg:text-[11px] ${value === undefined ? "" : "max-lg:hidden"}`}
      >
        {range(estimate)}
      </span>
      {value !== undefined && (
        <motion.span
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={FADE}
          className="text-[10px] font-semibold text-fg lg:mt-0.5 lg:text-sm"
        >
          {value.toFixed(1)}
        </motion.span>
      )}
    </div>
  );
}

const Wire = ({ critical }: { critical: boolean }) => (
  <span aria-hidden className={`w-1.5 shrink-0 lg:w-3 ${critical ? "h-0.5 bg-accent" : "h-px bg-line"}`} />
);

export interface StreamNetworkProps {
  streams: Stream[];
  /** The roll on display; boxes show its sampled values. */
  sample: RunSample | null;
}

/** Start, one row per parallel stream, then Event prep. */
export function StreamNetwork({ streams, sample }: StreamNetworkProps) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-center gap-1">
      <div className="hidden items-center gap-3 pl-[6.125rem] pr-[6.5rem] text-[11px] text-muted lg:flex">
        <span className="flex-1 text-center">Shortlist</span>
        <span className="flex-1 text-center">Confirm</span>
      </div>
      <div className="flex min-w-0 items-center">
        <motion.div layout aria-hidden className="w-1 self-stretch rounded-full bg-line lg:w-1.5" />
        <div className="relative flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {streams.map((stream, i) => {
              const critical = sample?.longest === i;
              return (
                <motion.div
                  key={stream.id}
                  data-stream={stream.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={MOTION}
                  className="flex h-[18px] min-w-0 items-center lg:h-10"
                >
                  <Wire critical={critical} />
                  <span
                    className={`w-11 shrink-0 truncate pl-0.5 text-[9px] lg:w-20 lg:pl-1 lg:text-xs ${critical ? "font-semibold text-fg" : "text-muted"}`}
                  >
                    {stream.name}
                  </span>
                  <TaskBox estimate={stream.shortlist} value={sample?.shortlist[i]} critical={critical} />
                  <Wire critical={critical} />
                  <TaskBox estimate={stream.confirm} value={sample?.confirm[i]} critical={critical} />
                  <Wire critical={critical} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <motion.div layout aria-hidden className="w-px self-stretch bg-line" />
        <Wire critical={sample !== null} />
        <div className="flex h-9 w-9 shrink-0 flex-col text-center lg:h-16 lg:w-20">
          <span className="text-[9px] text-muted lg:text-xs">Prep</span>
          <TaskBox estimate={PREP} value={sample?.prep} critical={sample !== null} />
        </div>
      </div>
    </div>
  );
}
