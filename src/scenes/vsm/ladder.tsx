"use client";

import { motion } from "motion/react";
import { HOURS_PER_DAY } from "@/engine/vsm/fixture";
import type { Step } from "@/engine/vsm/types";
import type { Summary } from "@/engine/vsm/vsm";
import { days } from "@/lib/format";
import { FADE } from "./motion";

interface LadderProps {
  steps: readonly Step[];
  totals: Summary;
  /** Days spanned by the full track; fixed so widths stay comparable across changes. */
  scaleDays: number;
  /** Lead time outlined behind the ladder, or null for none. */
  baselineDays: number | null;
}

const share = (d: number, scale: number) => `${(d / scale) * 100}%`;

export function Ladder({ steps, totals, scaleDays, baselineDays }: LadderProps) {
  return (
    <div className="flex items-stretch gap-2 lg:gap-3">
      <div className="relative h-9 flex-1 lg:h-36">
        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-sm border border-dashed border-muted"
          style={{ width: share(baselineDays ?? 0, scaleDays) }}
          initial={false}
          animate={{ opacity: baselineDays === null ? 0 : 0.6 }}
          transition={FADE}
        />
        <div className="flex h-full">
          {steps.map((s) => (
            <Segments key={s.id} step={s} scaleDays={scaleDays} />
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-between py-0.5 text-right text-[0.65rem] font-semibold tabular-nums lg:text-sm">
        <span className="text-accent">{days(totals.processDays)}</span>
        <span className="text-constraint">{days(totals.waitDays)}</span>
      </div>
    </div>
  );
}

function Segments({ step, scaleDays }: { step: Step; scaleDays: number }) {
  return (
    <>
      <motion.div
        layout
        data-wait={step.waitDays}
        className="flex h-full flex-col justify-end"
        style={{ width: share(step.waitDays, scaleDays) }}
      >
        <div className="hatch h-2.5 border-y border-constraint text-constraint lg:h-4" />
      </motion.div>
      <motion.div
        layout
        className="h-full min-w-[3px] border-x border-fg/40"
        style={{ width: share(step.processHours / HOURS_PER_DAY, scaleDays) }}
      >
        <div className="h-2.5 bg-accent lg:h-4" />
      </motion.div>
    </>
  );
}
