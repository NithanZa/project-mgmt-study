"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

export interface ReadoutProps {
  label: string;
  value: number;
  format?: (value: number) => string;
}

const round = (v: number) => String(Math.round(v));

export function Readout({ label, value, format = round }: ReadoutProps) {
  const motionValue = useMotionValue(value);
  const display = useTransform(() => format(motionValue.get()));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.4, ease: "easeOut" });
    return () => controls.stop();
  }, [value, motionValue]);

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[0.7rem] uppercase tracking-wide text-muted">{label}</span>
      {/* The final value reserves the width, so counting through wider or narrower
          numbers never shifts neighbouring readouts. */}
      <span aria-hidden className="grid justify-items-end text-lg font-semibold tabular-nums text-fg">
        <span className="invisible col-start-1 row-start-1">{format(value)}</span>
        <motion.span className="col-start-1 row-start-1 whitespace-nowrap">{display}</motion.span>
      </span>
      <span className="sr-only">{format(value)}</span>
    </div>
  );
}
