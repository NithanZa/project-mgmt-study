"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Mark, Order } from "@/engine/dsm/types";
import { FADE, MARKS, NAME, SPRING, blockRows, nodeLayoutId, sameMark } from "./model";
import { NAME_W } from "./use-shape";

const N = 8;
const pct = (cells: number, of: number) => `${(cells / of) * 100}%`;
/** Cells above the diagonal, traced as one staircase polygon in an N × N box. */
const UPPER = [
  "1,0",
  `${N},0`,
  `${N},${N - 1}`,
  ...Array.from({ length: N - 1 }, (_, k) => {
    const i = N - 1 - k;
    return `${i},${i} ${i},${i - 1}`;
  }),
].join(" ");

export interface MatrixProps {
  order: Order;
  hot: Mark | null;
  onHot: (mark: Mark | null) => void;
  /** Rows can be dragged and moved with Alt+arrow keys. */
  movable: boolean;
  /** A dragged row crossed into row `to`. */
  onDragMove: (id: string, to: number) => void;
  onKeyMove: (id: string, delta: -1 | 1) => void;
  showBlock: boolean;
  /** Tint the region above the diagonal and dim the dots below it. */
  stressRework: boolean;
  names: boolean;
}

export function Matrix({
  order,
  hot,
  onHot,
  movable,
  onDragMove,
  onKeyMove,
  showBlock,
  stressRework,
  names,
}: MatrixProps) {
  const pos = new Map(order.map((id, i) => [id, i]));
  const block = blockRows(order);
  const blockSize = block.last - block.first + 1;
  const nameW = names ? NAME_W : "0px";

  return (
    <div
      data-matrix
      className="@container relative aspect-square"
      style={{ width: `min(calc(100cqw - ${nameW}), 100cqh)`, marginLeft: nameW }}
    >
      <div
        className="absolute top-0 right-0 flex"
        style={{ left: pct(1, N + 1), height: pct(1, N + 1) }}
        aria-hidden
      >
        {order.map((id) => (
          <motion.div
            key={id}
            layoutId={`col-${id}`}
            transition={SPRING}
            data-col={id}
            className={`flex flex-1 items-center justify-center font-semibold ${hot?.col === id ? "text-accent" : "text-muted"}`}
            style={{ fontSize: "max(9px, 4cqw)" }}
          >
            {id}
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0" style={{ top: pct(1, N + 1) }}>
        <svg
          viewBox={`0 0 ${N} ${N}`}
          preserveAspectRatio="none"
          className="absolute inset-y-0 right-0 h-full"
          style={{ width: pct(N, N + 1) }}
          aria-hidden
        >
          <motion.polygon
            points={UPPER}
            className="fill-constraint/10"
            initial={false}
            animate={{ opacity: stressRework ? 1 : 0 }}
            transition={FADE}
          />
          {order.map((id, i) => (
            <rect key={id} x={i} y={i} width={1} height={1} className="fill-fg/10" />
          ))}
          <g className="stroke-line" strokeWidth={1}>
            {Array.from({ length: N + 1 }, (_, i) => (
              <g key={i}>
                <line x1={i} y1={0} x2={i} y2={N} vectorEffect="non-scaling-stroke" />
                <line x1={0} y1={i} x2={N} y2={i} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        </svg>

        {/* Rows stack in DOM order (so Tab follows the matrix) but are placed by a
            transform, so moving one is a compositor animation, never a layout change. */}
        <div className="absolute inset-0">
          {order.map((id, i) => (
            <Row
              key={id}
              id={id}
              index={i}
              pos={pos}
              hot={hot}
              onHot={onHot}
              movable={movable}
              onDragMove={onDragMove}
              onKeyMove={onKeyMove}
              dim={stressRework}
              names={names}
            />
          ))}
        </div>

        <AnimatePresence>
          {showBlock && (
            <motion.div
              key="block"
              layout
              data-block={order.slice(block.first, block.last + 1).join("")}
              className="pointer-events-none absolute"
              style={{
                left: pct(1 + block.first, N + 1),
                width: pct(blockSize, N + 1),
                top: pct(block.first, N),
                height: pct(blockSize, N),
                borderRadius: 6,
                boxShadow: "0 0 0 2.5px var(--fg)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ...SPRING, opacity: FADE }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface RowProps {
  id: string;
  index: number;
  pos: Map<string, number>;
  hot: Mark | null;
  onHot: (mark: Mark | null) => void;
  movable: boolean;
  onDragMove: (id: string, to: number) => void;
  onKeyMove: (id: string, delta: -1 | 1) => void;
  dim: boolean;
  names: boolean;
}

function Row({ id, index, pos, hot, onHot, movable, onDragMove, onKeyMove, dim, names }: RowProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Row position in row units: springs to `index`, follows the pointer while dragged.
  const at = useMotionValue(index);
  const y = useTransform(() => `${at.get() * 100}%`);
  const drag = useRef<{ startY: number; from: number; rowH: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (dragging) return;
    if (reduce) {
      at.jump(index);
      return;
    }
    const controls = animate(at, index, SPRING);
    return () => controls.stop();
  }, [at, index, dragging, reduce]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!movable || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    at.stop();
    drag.current = { startY: e.clientY, from: at.get(), rowH: ref.current!.getBoundingClientRect().height };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const next = Math.min(Math.max(d.from + (e.clientY - d.startY) / d.rowH, 0), N - 1);
    at.set(next);
    // Swap as soon as the row's centre crosses into its neighbour, like a sortable list.
    if (Math.round(next) !== index) onDragMove(id, Math.round(next));
  };
  const onDragEnd = () => {
    drag.current = null;
    setDragging(false);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!movable || !e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    onKeyMove(id, e.key === "ArrowUp" ? -1 : 1);
  };

  return (
    <motion.div
      ref={ref}
      className="absolute inset-x-0 top-0 flex"
      style={{ height: pct(1, N), y, zIndex: dragging ? 1 : 0 }}
      data-row={id}
    >
      {names && (
        <motion.span
          className="absolute right-full flex h-full items-center justify-end pr-3 text-right text-xs leading-tight whitespace-nowrap text-muted"
          style={{ width: NAME_W }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={FADE}
        >
          {NAME[id]}
        </motion.span>
      )}
      <div className="h-full p-[0.5cqw]" style={{ width: pct(1, N + 1) }}>
        <motion.button
          type="button"
          layoutId={nodeLayoutId(id)}
          transition={SPRING}
          data-header={id}
          tabIndex={movable ? 0 : -1}
          aria-label={`${NAME[id]}, row ${index + 1} of ${N}${movable ? ". Drag, or press Alt with an arrow key, to move." : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onLostPointerCapture={onDragEnd}
          onKeyDown={onKeyDown}
          className={`flex size-full items-center justify-center border bg-surface-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${movable ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-default"} ${hot?.row === id ? "border-accent text-accent" : "border-line text-fg"}`}
          style={{ borderRadius: "22%", fontSize: "max(9px, 4cqw)" }}
        >
          {id}
        </motion.button>
      </div>
      <div className="relative flex-1">
        {MARKS.filter((m) => m.row === id).map((m) => {
          const col = pos.get(m.col)!;
          const above = col > index;
          return (
            <motion.button
              key={m.col}
              type="button"
              layout="position"
              data-mark={`${m.row}${m.col}`}
              data-above={above || undefined}
              aria-label={`${NAME[m.row]} needs ${NAME[m.col]}${above ? ", planned after it" : ""}`}
              onPointerEnter={() => onHot(m)}
              onPointerLeave={() => onHot(null)}
              onFocus={() => onHot(m)}
              onBlur={() => onHot(null)}
              onClick={() => onHot(m)}
              className={`absolute top-0 flex h-full items-center justify-center rounded-[22%] focus-visible:outline-2 focus-visible:outline-accent ${sameMark(hot, m) ? "bg-accent-soft" : ""}`}
              style={{ left: pct(col, N), width: pct(1, N) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: dim && !above ? 0.35 : 1 }}
              transition={{ ...SPRING, opacity: { ...FADE, delay: index * 0.03 } }}
            >
              <svg viewBox="0 0 10 10" className="size-[62%]" aria-hidden>
                {above ? (
                  <circle cx={5} cy={5} r={3.1} strokeWidth={1.6} className="fill-none stroke-constraint" />
                ) : (
                  <circle cx={5} cy={5} r={2.4} className="fill-accent" />
                )}
              </svg>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
