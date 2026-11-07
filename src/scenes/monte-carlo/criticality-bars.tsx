"use client";

import { motion } from "motion/react";
import { useSpots } from "@/components/lesson/spotlight";
import type { Stream } from "@/engine/monte-carlo/types";
import { pct } from "@/lib/format";

export interface CriticalityBarsProps {
  streams: Stream[];
  /** Share of runs each stream set the finish; same order as `streams`. */
  shares: number[];
}

/** How often each stream was the longest path. */
export function CriticalityBars({ streams, shares }: CriticalityBarsProps) {
  const top = Math.max(...shares);
  return (
    <ul className="absolute inset-0 flex flex-col justify-center gap-1.5 lg:gap-3">
      {streams.map((stream, i) => (
        <Bar key={stream.id} stream={stream} share={shares[i] ?? 0} lead={shares[i] === top} />
      ))}
    </ul>
  );
}

function Bar({ stream, share, lead }: { stream: Stream; share: number; lead: boolean }) {
  const spot = useSpots(["share", stream.id]);
  return (
    <li {...spot} className="flex items-center gap-2 text-[10px] lg:text-sm">
      <span className={`w-12 shrink-0 truncate lg:w-20 ${lead ? "font-semibold text-fg" : "text-muted"}`}>
        {stream.name}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-sm bg-surface-2 lg:h-6">
        <motion.div
          className={`h-full origin-left rounded-sm ${lead ? "bg-accent" : "bg-float/60"}`}
          initial={false}
          animate={{ scaleX: share }}
        />
      </div>
      <span className={`w-8 shrink-0 text-right tabular-nums lg:w-10 ${lead ? "font-semibold" : ""}`}>
        {pct(share)}
      </span>
    </li>
  );
}
