"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { useSpots } from "@/components/lesson/spotlight";
import { backwardMarks, inputsOf } from "@/engine/dsm/dsm";
import { BIKE } from "@/engine/dsm/fixture";
import type { Mark } from "@/engine/dsm/types";
import { FADE, LOOPS, MARKS, NAME, SPRING, edgeKey, nodeLayoutId } from "./model";

type Pt = [number, number];

/** Layer (left to right) and lane of each node; the E → P → T loop forms a triangle. */
const POS: Record<string, Pt> = {
  M: [0, 0],
  C: [1, 0],
  I: [2, 0],
  E: [3, 0],
  P: [4, 1],
  T: [5, 0],
  L: [4, -1],
  R: [6, 0],
};
/** Control points for edges that would otherwise cross a node. */
const BEND: Record<string, Pt> = { "C>E": [2, -1], "T>E": [4, 0.6] };
const LOOP_KEYS = new Set(LOOPS.map(edgeKey));
/** The arrow that runs backwards: a later task feeding an earlier one. */
const BACKWARD_KEYS = new Set(backwardMarks(BIKE).map(edgeKey));
const NEEDS = Object.fromEntries(
  BIKE.map((a) => {
    const inputs = inputsOf(BIKE, a.id).map((d) => NAME[d]);
    const text =
      inputs.length > 1 ? `${inputs.slice(0, -1).join(", ")} and ${inputs.at(-1)}` : inputs[0];
    return [a.id, `${a.name}: needs ${text ?? "nothing"}`];
  }),
) as Record<string, string>;

export interface GraphProps {
  /** Full-canvas variant whose nodes morph into the matrix row headers. */
  big?: boolean;
  /** Lay layers out top to bottom instead of left to right. */
  rotated?: boolean;
  hot?: Mark | null;
  /** The node whose inputs are lit. */
  hotNode?: string | null;
  /** When given, nodes become buttons that light their own inputs. */
  onHotNode?: (id: string | null) => void;
}

export function Graph({
  big = false,
  rotated = false,
  hot = null,
  hotNode = null,
  onHotNode,
}: GraphProps) {
  const r = big ? 30 : 36;
  const long = 700;
  const short = big ? 360 : 300;
  const [w, h] = rotated ? [short, long] : [long, short];
  const at = ([layer, lane]: Pt): Pt =>
    rotated ? [short / 2 + lane * 100, 50 + layer * 100] : [50 + layer * 100, short / 2 + lane * 100];
  const hotKey = hot ? edgeKey(hot) : null;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div
      className="@container relative"
      style={{ width: `min(100cqw, ${w / h} * 100cqh)`, aspectRatio: `${w} / ${h}` }}
    >
      <motion.svg
        viewBox={`0 0 ${w} ${h}`}
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={FADE}
      >
        <defs>
          {(["muted", "accent", "constraint"] as const).map((c) => (
            <marker
              key={c}
              id={`dsm-arrow-${c}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="12"
              markerHeight="12"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 Z" style={{ fill: `var(--${c})` }} />
            </marker>
          ))}
        </defs>
        {MARKS.map((m) => {
          const key = edgeKey(m);
          return (
            <Edge
              key={key}
              edgeId={key}
              d={edgePath(at(POS[m.col]), at(POS[m.row]), r, BEND[key] && at(BEND[key]))}
              hot={key === hotKey || m.row === hotNode}
              faded={hotNode !== null && m.row !== hotNode}
            />
          );
        })}
      </motion.svg>
      {Object.entries(POS).map(([id, p]) => {
        const [x, y] = at(p);
        const lit =
          (hot !== null && (hot.row === id || hot.col === id)) ||
          (hotNode !== null && (hotNode === id || inputsOf(BIKE, hotNode).includes(id)));
        return (
          <Node
            key={id}
            id={id}
            big={big}
            lit={lit}
            onHotNode={onHotNode}
            style={{
              left: pct(x, w),
              top: pct(y, h),
              width: pct(2 * r, w),
              marginLeft: pct(-r, w),
              marginTop: pct(-r, w),
              aspectRatio: "1",
            }}
            fontSize={`max(8px, ${(r * 90) / w}cqw)`}
            label={
              big && !rotated ? (
                <motion.span
                  className={`absolute left-1/2 hidden w-max max-w-28 -translate-x-1/2 rounded bg-surface/85 px-1 text-center text-xs leading-tight text-balance text-muted @min-[30rem]:block ${p[1] < 0 ? "bottom-full mb-1" : "top-full mt-1"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={FADE}
                >
                  {NAME[id]}
                </motion.span>
              ) : null
            }
          />
        );
      })}
    </div>
  );
}

interface EdgeProps {
  edgeId: string;
  d: string;
  hot: boolean;
  /** Another node's inputs are lit, so this edge steps back. */
  faded: boolean;
}

/** One dependency arrow. The spotlight wraps it in a group so its own fade stays separate. */
function Edge({ edgeId, d, hot, faded }: EdgeProps) {
  const loop = LOOP_KEYS.has(edgeId);
  const spot = useSpots([
    BACKWARD_KEYS.has(edgeId) ? "feedback" : "inputs",
    ...(loop ? ["loop"] : []),
  ]);
  const color = loop ? "constraint" : hot ? "accent" : "muted";
  return (
    <g {...spot}>
      {hot && (
        <motion.path
          key={`pulse-${edgeId}`}
          d={d}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          style={{ stroke: `var(--${loop ? "constraint" : "accent"})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0.15] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
      <motion.path
        d={d}
        data-edge={edgeId}
        data-hot={hot || undefined}
        fill="none"
        strokeWidth={hot ? 5 : loop ? 3 : 2}
        strokeDasharray={loop ? "8 5" : undefined}
        markerEnd={`url(#dsm-arrow-${color})`}
        style={{ stroke: `var(--${color})` }}
        initial={false}
        animate={{ opacity: faded ? 0.35 : 1 }}
        transition={FADE}
      />
    </g>
  );
}

interface NodeProps {
  id: string;
  big: boolean;
  lit: boolean;
  onHotNode?: (id: string | null) => void;
  style: CSSProperties;
  fontSize: string;
  label: ReactNode;
}

/** A node circle. It answers to `node-<id>`, the row term and "rows"/"columns", since it becomes that row and column. */
function Node({ id, big, lit, onHotNode, style, fontSize, label }: NodeProps) {
  const spot = useSpots([`node-${id}`, `row-${id.toLowerCase()}`, "rows", "columns"]);
  const className = `flex size-full items-center justify-center border-2 bg-surface font-semibold ${lit ? "border-accent text-accent" : "border-fg/60 text-fg"}`;
  const shared = {
    layoutId: big ? nodeLayoutId(id) : undefined,
    transition: SPRING,
    "data-node": id,
    style: { borderRadius: "50%", fontSize },
  };
  return (
    <div className="absolute" style={style} {...spot}>
      {onHotNode ? (
        <motion.button
          {...shared}
          type="button"
          aria-label={NEEDS[id]}
          onPointerEnter={() => onHotNode(id)}
          onPointerLeave={() => onHotNode(null)}
          onFocus={() => onHotNode(id)}
          onBlur={() => onHotNode(null)}
          onClick={() => onHotNode(id)}
          className={`${className} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
        >
          {id}
        </motion.button>
      ) : (
        <motion.div {...shared} className={className}>
          {id}
        </motion.div>
      )}
      {label}
    </div>
  );
}

/** Straight or quadratic edge between two node centres, trimmed to the node rims. */
function edgePath(from: Pt, to: Pt, r: number, bend?: Pt): string {
  const toward = (a: Pt, b: Pt, by: number): Pt => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a[0] + ((b[0] - a[0]) / len) * by, a[1] + ((b[1] - a[1]) / len) * by];
  };
  const a = toward(from, bend ?? to, r + 2);
  const b = toward(to, bend ?? from, r + 4);
  const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return bend ? `M${f(a)} Q${f(bend)} ${f(b)}` : `M${f(a)} L${f(b)}`;
}
