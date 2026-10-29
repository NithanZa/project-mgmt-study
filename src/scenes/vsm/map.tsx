"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Step, StepId, Waste } from "@/engine/vsm/types";
import { FADE, SPRING } from "./motion";

export const WASTE_LABEL: Record<Waste, string> = {
  batching: "Batching",
  handoff: "Handoff",
  waiting: "Waiting",
  approval: "Approval",
};

const SLOT = 70;
const HEIGHT = 128;
const TRI_X = 13;
const BOX = { x: 27, y: 42, w: 41, h: 42 };
const DATA = { y: 88, h: 17 };
const CHIP = { r: 2.6, gap: 6.5, base: 55 };
const FLOW_Y = 72;
/** Room on the left for the first waste tag, which is wider than its triangle. */
const PAD_LEFT = 10;

interface StreamMapProps {
  steps: readonly Step[];
  showWaste: boolean;
  active: StepId | null;
  onInspect: (id: StepId, target: SVGGElement) => void;
  onLeave: (id: StepId) => void;
}

export function StreamMap({ steps, showWaste, active, onInspect, onLeave }: StreamMapProps) {
  const width = SLOT * steps.length;
  return (
    <svg
      viewBox={`${-PAD_LEFT} 0 ${width + PAD_LEFT} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto max-h-full min-h-0 w-full shrink overflow-visible [@container_(max-height:8.5rem)]:hidden"
    >
      <line x1={2} x2={width - 4} y1={FLOW_Y} y2={FLOW_Y} className="stroke-line" strokeWidth={1.5} />
      <path
        d={`M${width - 9} ${FLOW_Y - 4} L${width - 3} ${FLOW_Y} L${width - 9} ${FLOW_Y + 4}`}
        className="fill-none stroke-line"
        strokeWidth={1.5}
      />
      {steps.map((s, i) => {
        const x = i * SLOT;
        const cx = x + TRI_X;
        const isActive = active === s.id;
        const delay = i * 0.03;
        return (
          <motion.g
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ x: { ...SPRING, delay }, opacity: { ...FADE, delay } }}
          >
            <g
              tabIndex={0}
              role="group"
              data-wait-before={s.id}
              aria-label={`Wait before ${s.name}: ${s.waitDays} days. ${WASTE_LABEL[s.waste]}: ${s.reason}`}
              className="cursor-help outline-none"
              onMouseEnter={(e) => onInspect(s.id, e.currentTarget)}
              onMouseLeave={() => onLeave(s.id)}
              onFocus={(e) => onInspect(s.id, e.currentTarget)}
              onBlur={() => onLeave(s.id)}
            >
              <rect x={x} y={8} width={BOX.x - 1} height={HEIGHT - 8} className="fill-transparent" />
              <AnimatePresence initial={false}>
                {Array.from({ length: Math.ceil(s.waitDays) }, (_, c) => (
                  <motion.circle
                    key={c}
                    cx={cx}
                    cy={CHIP.base - c * CHIP.gap}
                    r={CHIP.r}
                    className="fill-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE}
                  />
                ))}
              </AnimatePresence>
              <path
                d={`M${cx - 10} 84 L${cx} 62 L${cx + 10} 84 Z`}
                className={isActive ? "fill-constraint stroke-constraint" : "fill-surface stroke-constraint"}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeLinejoin="round"
              />
              <text
                x={cx}
                y={98}
                textAnchor="middle"
                fontSize={12}
                className="fill-constraint font-semibold tabular-nums"
              >
                {s.waitDays} d
              </text>
              <motion.text
                x={cx}
                y={118}
                textAnchor="middle"
                fontSize={9.5}
                className="fill-muted"
                initial={false}
                animate={{ opacity: showWaste ? 1 : 0 }}
                transition={{ ...FADE, delay: showWaste ? delay : 0 }}
              >
                {WASTE_LABEL[s.waste].toLowerCase()}
              </motion.text>
            </g>
            <rect
              x={x + BOX.x}
              y={BOX.y}
              width={BOX.w}
              height={BOX.h}
              rx={5}
              className="fill-surface-2 stroke-fg/40"
            />
            {s.name
              .replace(/-/g, "- ")
              .split(" ")
              .map((line, l, lines) => (
                <text
                  key={line}
                  x={x + BOX.x + BOX.w / 2}
                  y={BOX.y + BOX.h / 2 + 3.5 + (l - (lines.length - 1) / 2) * 11}
                  textAnchor="middle"
                  fontSize={10.5}
                  className="fill-fg"
                >
                  {line}
                </text>
              ))}
            <rect
              x={x + BOX.x}
              y={DATA.y}
              width={BOX.w}
              height={DATA.h}
              rx={3}
              className="fill-accent-soft stroke-accent"
            />
            <text
              x={x + BOX.x + BOX.w / 2}
              y={DATA.y + 12}
              textAnchor="middle"
              fontSize={11}
              className="fill-accent font-semibold tabular-nums"
            >
              {s.processHours} h
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
