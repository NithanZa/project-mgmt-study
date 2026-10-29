"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DEMAND } from "@/engine/toc/fixture";
import { MARKET, type LineConfig, type LineResult } from "@/lib/line-sim";

/** Market plus five stations; the invest panel reuses it to align its buttons with the tiles. */
export const COLUMNS = "grid grid-cols-6 gap-1.5 sm:gap-3";

const LOAVES_PER_CHIP = 10;
const MAX_CHIPS = 12;
const DIAL_MAX = 80;
const FLOW_SCALE = 60;
const FADE = { duration: 0.18, ease: "easeOut" } as const;
// 270° gauge, open at the bottom.
const ARC = "M 8.69 31.31 A 16 16 0 1 1 31.31 31.31";

interface Column {
  id: string;
  name: string;
  capacity: number;
  waiting: number;
  flow: number;
  busy: number | null;
}

function columnsAt(config: LineConfig, result: LineResult, tick: number): Column[] {
  const state = result.ticks[tick];
  const out = result.cfd[tick].cumulativeOut;
  return [
    { id: MARKET, name: "Market", capacity: DEMAND, waiting: 0, flow: state.released, busy: null },
    ...config.stations.map((s, i) => {
      const capacity = Math.round(s.capacity * (config.efficiency?.[s.id] ?? 1));
      return {
        id: s.id,
        name: s.name,
        capacity,
        waiting: Math.max(0, state.queues[i] - capacity),
        flow: state.processed[i],
        busy: out[i] / (s.capacity * (tick + 1)),
      };
    }),
  ];
}

export interface LineProps {
  config: LineConfig;
  result: LineResult;
  tick: number;
  /** Milliseconds per tick, so batches arrive before the next one leaves. */
  interval: number;
  playing: boolean;
  revealConstraint: boolean;
  showBusy: boolean;
  selected?: string;
  onSelect?: (stationId: string) => void;
}

export function Line({ config, result, tick, interval, playing, revealConstraint, showBusy, selected, onSelect }: LineProps) {
  const batch = { type: "spring", bounce: 0.2, visualDuration: Math.min(0.4, (interval * 0.8) / 1000) } as const;
  // Reduced motion keeps opacity animations, so the looping pulse is switched off by hand.
  const reduce = useReducedMotion();
  const pulse = playing && !reduce;
  return (
    <div className={`${COLUMNS} min-h-0 flex-1`}>
      {columnsAt(config, result, tick).map((col, c) => {
        const isConstraint = revealConstraint && result.constraint === col.id;
        const selectable = onSelect !== undefined && col.id !== MARKET;
        const Tile = selectable ? "button" : "div";
        return (
          <div key={col.id} data-column={col.id} className="flex min-h-0 min-w-0 flex-col gap-1">
            <Pile waiting={col.waiting} />
            <Tile
              {...(selectable && {
                type: "button" as const,
                "aria-pressed": selected === col.id,
                onClick: () => onSelect(col.id),
              })}
              className={`relative flex flex-col items-center rounded-md bg-surface-2 px-0.5 pt-1 pb-2.5 sm:pt-2 sm:pb-4 ${isConstraint ? "border-2 border-constraint" : col.id === MARKET ? "border border-dashed border-line" : "border border-line"} ${selectable ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-accent" : ""} ${selected === col.id ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""}`}
            >
              {isConstraint && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-[0.9rem] border-2 border-constraint"
                  initial={{ opacity: 0 }}
                  animate={pulse ? { opacity: [0.1, 0.55, 0.1] } : { opacity: 0.3 }}
                  transition={pulse ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : FADE}
                />
              )}
              {isConstraint && (
                <motion.span
                  layoutId="toc-constraint-tag"
                  className="absolute -top-3 z-10 rounded-full bg-constraint px-1.5 text-[9px] leading-3.5 font-medium text-surface sm:-top-2.5 sm:text-[10px] sm:leading-4"
                >
                  constraint
                </motion.span>
              )}
              <span className="text-[10px] leading-tight font-medium sm:text-xs">{col.name}</span>
              <Dial value={col.capacity} />
              {selectable && <span className="sr-only">per hour</span>}
              <span className="absolute inset-x-0 bottom-1 flex justify-center sm:bottom-1.5">
                {col.flow > 0 && (
                  <motion.span
                    data-batch
                    layoutId={`toc-batch-${tick - c}`}
                    transition={{ layout: batch }}
                    className="block h-1 rounded-full bg-accent sm:h-1.5"
                    style={{ width: `${Math.min(1, col.flow / FLOW_SCALE) * 85}%` }}
                  />
                )}
              </span>
            </Tile>
            <Busy value={col.busy} showLabel={showBusy} />
          </div>
        );
      })}
    </div>
  );
}

function Pile({ waiting }: { waiting: number }) {
  const chips = Math.min(MAX_CHIPS, Math.ceil(waiting / LOAVES_PER_CHIP));
  return (
    <div data-waiting={waiting} className="flex min-h-0 flex-1 flex-col items-center justify-end gap-0.5">
      <span className={`text-[10px] leading-none font-semibold tabular-nums text-constraint sm:text-sm ${waiting ? "" : "invisible"}`}>
        {waiting}
      </span>
      <div className="grid max-h-80 min-h-0 w-3/4 flex-1 grid-rows-[repeat(12,minmax(0,1fr))] gap-px sm:gap-0.5">
        <AnimatePresence initial={false}>
          {Array.from({ length: chips }, (_, i) => (
            <motion.span
              key={i}
              className="hatch rounded-[3px] border border-constraint/70 text-constraint"
              style={{ gridRowStart: MAX_CHIPS - i }}
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: FADE }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Dial({ value }: { value: number }) {
  return (
    <span className="relative block h-5 w-7 sm:aspect-square sm:h-auto sm:w-14 lg:w-16">
      <svg viewBox="0 0 40 40" className="hidden size-full sm:block" aria-hidden>
        <path d={ARC} className="fill-none stroke-line" strokeWidth={4} strokeLinecap="round" />
        <motion.path
          d={ARC}
          className="fill-none stroke-accent"
          strokeWidth={4}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: Math.min(1, value / DIAL_MAX) }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums sm:text-sm">
        {value}
      </span>
    </span>
  );
}

function Busy({ value, showLabel }: { value: number | null; showLabel: boolean }) {
  if (value === null) return <div className="h-3 sm:h-4" />;
  return (
    <div data-busy={Math.round(value * 100)} className="flex h-3 items-center gap-1 sm:h-4">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-line sm:h-1.5">
        <motion.div
          className="h-full origin-left rounded-full bg-fg/60"
          initial={false}
          animate={{ scaleX: Math.min(1, value) }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
      </div>
      <motion.span
        aria-hidden={!showLabel}
        className="w-6 text-right text-[9px] tabular-nums text-muted sm:w-8 sm:text-[11px]"
        initial={false}
        animate={{ opacity: showLabel ? 1 : 0 }}
        transition={FADE}
      >
        {Math.round(value * 100)}%
      </motion.span>
    </div>
  );
}
