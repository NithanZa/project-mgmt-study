"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Graph } from "./graph";
import { FADE } from "./model";
import { GRAPH_SHARE, type Shape } from "./use-shape";

export type View = "graph" | "matrix";

export interface MorphProps {
  view: View;
  shape: Shape;
  /** Small panel beside or above the matrix (compact graph or plan). */
  slot: ReactNode;
  matrix: ReactNode;
}

/**
 * Renders either the full-canvas graph or the matrix layout, never both: the
 * graph nodes and the matrix row headers share layout ids, so switching views
 * flies each node onto its header and back.
 */
export function Morph({ view, shape, slot, matrix }: MorphProps) {
  if (view === "graph") {
    return (
      <div className="absolute inset-0 flex items-center justify-center [container-type:size]">
        <Graph big rotated={shape.tall} />
      </div>
    );
  }
  return (
    <div className={`absolute inset-0 flex gap-3 pb-2 ${shape.side ? "flex-row" : "flex-col"}`}>
      <motion.div
        className={`relative shrink-0 [container-type:size] ${shape.side ? "w-[36%]" : ""}`}
        style={shape.side ? undefined : { height: `${GRAPH_SHARE * 100}%` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={FADE}
      >
        {slot}
      </motion.div>
      <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center [container-type:size]">
        {matrix}
      </div>
    </div>
  );
}
