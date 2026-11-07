"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSpot, useSpots, type SpotAttributes } from "@/components/lesson/spotlight";
import { PREP } from "@/engine/monte-carlo/fixture";
import type { Estimate, RunSample, Stream } from "@/engine/monte-carlo/types";
import { FADE, MOTION } from "./scale";

const range = ({ o, m, p }: Estimate) => `${o}–${m}–${p}`;

interface TaskBoxProps {
  estimate: Estimate;
  value?: number;
  critical: boolean;
  /** Term id for the three-point range text. */
  rangeSpot: string;
  /** Spotlight tags for the box and its sampled value. */
  spot?: SpotAttributes;
}

// The box, its range and its value are sibling leaves, each tagged on its own: a tagged
// parent would dim a lit child with it.
function TaskBox({ estimate, value, critical, rangeSpot, spot }: TaskBoxProps) {
  const rangeAttrs = useSpot(rangeSpot);
  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center leading-none tabular-nums">
      <span
        aria-hidden
        {...spot}
        className={`absolute inset-0 rounded-[0.4rem] lg:rounded-md ${
          critical ? "border-2 border-accent bg-accent-soft" : "border border-line bg-surface-2"
        }`}
      />
      <span
        {...rangeAttrs}
        className={`relative text-[9px] text-muted lg:text-[11px] ${value === undefined ? "" : "max-lg:hidden"}`}
      >
        {range(estimate)}
      </span>
      {value !== undefined && (
        // Wrapper carries the tag: the fade writes an inline opacity that would beat the dimming.
        <span {...spot} className="relative lg:mt-0.5">
          <motion.span
            key={value}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={FADE}
            className="block text-[10px] font-semibold text-fg lg:text-sm"
          >
            {value.toFixed(1)}
          </motion.span>
        </span>
      )}
    </div>
  );
}

const Wire = ({ critical, spot }: { critical: boolean; spot?: SpotAttributes }) => (
  <span
    aria-hidden
    {...spot}
    className={`w-1.5 shrink-0 lg:w-3 ${critical ? "h-0.5 bg-accent" : "h-px bg-line"}`}
  />
);

interface StreamRowProps {
  stream: Stream;
  index: number;
  sample: RunSample | null;
  rangeSpot: string;
}

/** One stream's wires, name, two boxes and, during a roll, its total. */
function StreamRow({ stream, index, sample, rangeSpot }: StreamRowProps) {
  const critical = sample?.longest === index;
  const spot = useSpots(critical ? ["streams", stream.id, "longest"] : ["streams", stream.id]);
  const total = sample ? sample.shortlist[index] + sample.confirm[index] : undefined;
  return (
    <>
      <Wire critical={critical} spot={spot} />
      <span
        {...spot}
        className={`w-11 shrink-0 truncate pl-0.5 text-[9px] lg:w-20 lg:pl-1 lg:text-xs ${critical ? "font-semibold text-fg" : "text-muted"}`}
      >
        {stream.name}
      </span>
      <TaskBox
        estimate={stream.shortlist}
        value={sample?.shortlist[index]}
        critical={critical}
        rangeSpot={rangeSpot}
        spot={spot}
      />
      <Wire critical={critical} spot={spot} />
      <TaskBox
        estimate={stream.confirm}
        value={sample?.confirm[index]}
        critical={critical}
        rangeSpot={rangeSpot}
        spot={spot}
      />
      {/* The right wire is long enough to carry the stream's rolled total above it. */}
      <span className="relative flex w-5 shrink-0 items-center self-stretch lg:w-9">
        <span aria-hidden {...spot} className={`w-full ${critical ? "h-0.5 bg-accent" : "h-px bg-line"}`} />
        {total !== undefined && (
          <span
            {...spot}
            data-total={stream.id}
            className={`absolute inset-x-0 bottom-1/2 text-center text-[9px] leading-none tabular-nums lg:mb-0.5 lg:text-[11px] ${
              critical ? "font-semibold text-fg" : "text-muted"
            }`}
          >
            <motion.span key={total} className="block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE}>
              {total.toFixed(1)}
            </motion.span>
          </span>
        )}
      </span>
    </>
  );
}

export interface StreamNetworkProps {
  streams: Stream[];
  /** The roll on display; boxes show its sampled values. */
  sample: RunSample | null;
  /** Term id the three-point ranges answer to on this beat. */
  rangeSpot: string;
}

/** Start, one row per parallel stream, then Event prep. */
export function StreamNetwork({ streams, sample, rangeSpot }: StreamNetworkProps) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-center gap-1">
      <div className="hidden items-center gap-3 pl-[6.125rem] pr-[8rem] text-[11px] text-muted lg:flex">
        <span className="flex-1 text-center">Shortlist</span>
        <span className="flex-1 text-center">Confirm</span>
      </div>
      <div className="flex min-w-0 items-center">
        <motion.div layout aria-hidden className="w-1 self-stretch rounded-full bg-line lg:w-1.5" />
        <div className="relative flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {streams.map((stream, i) => (
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
                <StreamRow stream={stream} index={i} sample={sample} rangeSpot={rangeSpot} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <motion.div layout aria-hidden className="w-px self-stretch bg-line" />
        <Wire critical={sample !== null} />
        <div className="flex h-9 w-9 shrink-0 flex-col text-center lg:h-16 lg:w-20">
          <span className="text-[9px] text-muted lg:text-xs">Prep</span>
          <TaskBox estimate={PREP} value={sample?.prep} critical={sample !== null} rangeSpot={rangeSpot} />
        </div>
      </div>
    </div>
  );
}
