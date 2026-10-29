"use client";

import { motion } from "motion/react";
import { expected } from "@/engine/pert/pert";
import type { PertTask } from "@/engine/pert/types";
import { betaPath, MOTION, type RowBox, type Scale } from "./geometry";

const LABEL_H = 14;
/** Tall rows still draw a short curve, so its label stays close to the bar. */
const CURVE_MAX = 64;

export interface EstimateRowProps {
  task: PertTask;
  box: RowBox;
  x: Scale;
  /** Right edge for the task name. */
  right: number;
  /** Beta curve shown and the marker moved from the mode to the expected value. */
  revealed: boolean;
}

export function EstimateRow({ task, box, x, right, revealed }: EstimateRowProps) {
  const { o, m, p } = task.estimate;
  const mean = expected(task.estimate);
  const top = box.labels ? LABEL_H : 0;
  const bar = Math.max(box.h - 5, top);
  const curveH = revealed ? Math.min(Math.max(bar - top - 2, 0), CURVE_MAX) : 0;
  const labels = box.labels ? 1 : 0;
  // Labels sit on their own bar (or its curve's peak), never at the top of a tall row.
  const nameY = bar - 7;
  const valueY = bar - curveH - 7;

  return (
    <motion.g
      data-task={task.id}
      initial={false}
      animate={{ y: box.y, opacity: box.h >= 6 ? 1 : 0 }}
      transition={MOTION}
    >
      <motion.text
        x={right}
        textAnchor="end"
        className="fill-muted text-[11px]"
        initial={false}
        animate={{ y: nameY, opacity: labels }}
        transition={MOTION}
      >
        {task.name}
      </motion.text>
      <motion.path
        className="fill-accent/15 stroke-accent/70"
        strokeWidth={1.25}
        initial={false}
        animate={{ d: betaPath(task.estimate, x, bar, curveH), opacity: revealed ? 1 : 0 }}
        transition={MOTION}
      />
      <motion.path
        data-range
        className="stroke-muted/60"
        strokeWidth={3}
        strokeLinecap="round"
        initial={false}
        animate={{ d: `M${x(o)} ${bar}H${x(p)}` }}
        transition={MOTION}
      />
      <motion.path
        data-mode
        className="stroke-fg"
        strokeWidth={2}
        initial={false}
        animate={{ d: `M${x(m)} ${bar - 5}V${bar + 4}` }}
        transition={MOTION}
      />
      <motion.g
        data-marker
        initial={false}
        animate={{ x: x(revealed ? mean : m) }}
        transition={MOTION}
      >
        <motion.path
          className={revealed ? "stroke-accent" : "stroke-fg"}
          strokeWidth={2}
          initial={false}
          animate={{ d: `M0 ${bar}V${valueY + 4}`, opacity: revealed ? 1 : 0 }}
          transition={MOTION}
        />
        <motion.text
          textAnchor="middle"
          className={`text-[11px] font-semibold tabular-nums ${revealed ? "fill-accent" : "fill-fg"}`}
          initial={false}
          animate={{ y: valueY, opacity: labels }}
          transition={MOTION}
        >
          {revealed ? mean.toFixed(1) : m}
        </motion.text>
      </motion.g>
    </motion.g>
  );
}
