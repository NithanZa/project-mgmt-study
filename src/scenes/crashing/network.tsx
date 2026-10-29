"use client";

import { motion, type Transition } from "motion/react";
import { useId } from "react";
import type { CrashTask } from "@/engine/crashing/types";
import { money } from "@/lib/format";

const W = 440;
const H = 175;
const NODE_W = 78;
const NODE_H = 44;
const FADE = { duration: 0.18, ease: "easeOut" } as const;
const FLASH: Transition = { duration: 0.55, times: [0, 0.25, 1], ease: "easeOut" };

const cx = (t: CrashTask) => 55 + t.pos.col * 110;
const cy = (t: CrashTask) => 40 + t.pos.row * 90;

function edgePath(from: CrashTask, to: CrashTask): string {
  const x1 = cx(from) + NODE_W / 2;
  const x2 = cx(to) - NODE_W / 2 - 3;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${cy(from)} C ${mid} ${cy(from)} ${mid} ${cy(to)} ${x2} ${cy(to)}`;
}

export interface NetworkProps {
  tasks: CrashTask[];
  base: CrashTask[];
  paths: string[][];
  /** Tasks shortened by the latest step. */
  recent: string[];
  /** Changes whenever the recent tasks should flash; null for no flash. */
  flash: number | null;
}

export function Network({ tasks, base, paths, recent, flash }: NetworkProps) {
  const id = useId();
  const critical = new Set(paths.flat());
  const criticalEdges = new Set(paths.flatMap((p) => p.slice(1).map((to, i) => `${p[i]}>${to}`)));
  const byId = new Map(tasks.map((t) => [t.id, t]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="size-full" aria-hidden>
      <defs>
        {(["muted", "accent"] as const).map((tone) => (
          <marker
            key={tone}
            id={`${id}-${tone}`}
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 z" className={tone === "muted" ? "fill-muted" : "fill-accent"} />
          </marker>
        ))}
      </defs>

      {tasks.flatMap((t) =>
        t.deps.map((dep) => {
          const key = `${dep}>${t.id}`;
          const d = edgePath(byId.get(dep)!, t);
          return (
            <g key={key}>
              <path d={d} className="fill-none stroke-muted" strokeWidth={1.25} markerEnd={`url(#${id}-muted)`} />
              <motion.path
                d={d}
                className="fill-none stroke-accent"
                strokeWidth={3}
                markerEnd={`url(#${id}-accent)`}
                initial={false}
                animate={{ opacity: criticalEdges.has(key) ? 1 : 0 }}
                transition={FADE}
              />
            </g>
          );
        }),
      )}

      {tasks.map((t, i) => {
        const x = cx(t) - NODE_W / 2;
        const y = cy(t) - NODE_H / 2;
        const saved = base[i].days - t.days;
        const isCritical = critical.has(t.id);
        const isRecent = recent.includes(t.id);
        return (
          <g
            key={t.id}
            data-task={t.id}
            data-critical={isCritical}
            data-recent={isRecent}
            data-locked={t.days === t.minDays}
          >
            {isRecent && flash !== null && (
              <motion.rect
                key={flash}
                x={x - 5}
                y={y - 5}
                width={NODE_W + 10}
                height={NODE_H + 10}
                rx={12}
                className="fill-accent-soft stroke-accent"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={FLASH}
              />
            )}
            <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={8} className="fill-surface-2 stroke-line" strokeWidth={1.5} />
            <motion.rect
              x={x}
              y={y}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              className="fill-accent-soft stroke-accent"
              strokeWidth={3}
              initial={false}
              animate={{ opacity: isCritical ? 1 : 0 }}
              transition={FADE}
            />
            <text x={cx(t)} y={cy(t) - 6} textAnchor="middle" className="fill-muted text-[10px]">
              {t.name}
            </text>
            <text x={cx(t)} y={cy(t) + 13} textAnchor="middle" className="fill-fg text-[15px] font-semibold tabular-nums">
              {t.days}d
              {saved > 0 && (
                <tspan dx={3} className="fill-muted text-[9px] font-normal">
                  −{saved}
                </tspan>
              )}
            </text>
            <g transform={`translate(${x + NODE_W - 11} ${y + 7})`}>
              <motion.g
                initial={false}
                animate={{ opacity: t.days === t.minDays ? 1 : 0 }}
                transition={FADE}
              >
                <path d="M -2.5 3 V 1 A 2.5 2.5 0 0 1 2.5 1 V 3" className="fill-none stroke-muted" strokeWidth={1.3} />
                <rect x={-4} y={3} width={8} height={6} rx={1.2} className="fill-muted" />
              </motion.g>
            </g>
            <text x={cx(t)} y={y + NODE_H + 13} textAnchor="middle" className="fill-muted text-[9.5px] tabular-nums">
              {t.costPerDay > 0 ? `${money(t.costPerDay)}/d · min ${t.minDays}` : "fixed"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
