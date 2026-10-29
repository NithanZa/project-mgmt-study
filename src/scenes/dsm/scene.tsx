"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { SceneFrame } from "@/components/lesson/scene-frame";
import { Button } from "@/components/ui/button";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import type { SceneProps } from "@/content/types";
import { feedback, moveRow } from "@/engine/dsm/dsm";
import { ALPHABETICAL, BIKE } from "@/engine/dsm/fixture";
import type { Mark, Order } from "@/engine/dsm/types";
import { Graph } from "./graph";
import { IterationPlan } from "./iteration-plan";
import { Matrix } from "./matrix";
import { BEST, BLOCK, FADE, LOOPS, MARKS, NAME, blockRows } from "./model";
import { Morph, type View } from "./morph";
import { useShape } from "./use-shape";

export const BEAT = { see: 0, rework: 1, partition: 2, play: 3, plan: 4 } as const;

const VIEWS: { value: View; label: string }[] = [
  { value: "graph", label: "Graph" },
  { value: "matrix", label: "Matrix" },
];
const LOOP_TEXT = LOOPS.map((m) => `${NAME[m.col]} feeds back into ${NAME[m.row]}`).join("; ");
const rows = (v: number) => `${Math.round(v)} rows`;
const marksAbove = (n: number) => `${n} mark${n === 1 ? "" : "s"} above the diagonal`;
const same = (a: Order, b: Order) => a.every((id, i) => id === b[i]);

export function DsmScene({ beat }: SceneProps) {
  const [ref, shape] = useShape<HTMLDivElement>();
  const [view, setView] = useState<View>("graph");
  const [order, setOrder] = useState<Order>(ALPHABETICAL);
  const [hot, setHot] = useState<Mark | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const shownView = beat === BEAT.see ? view : "matrix";
  // The first two beats teach on the alphabetical order; later beats show the learner's own.
  const shown = beat <= BEAT.rework ? ALPHABETICAL : order;
  const count = useMemo(() => feedback(BIKE, shown).count, [shown]);
  const block = blockRows(shown);
  const blockSpan = block.last - block.first + 1;
  const showBlock = beat >= BEAT.partition;
  const movable = beat >= BEAT.play;

  const moveByKey = (id: string, delta: -1 | 1) => {
    const from = order.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= order.length) return;
    const next = moveRow(order, from, to);
    setOrder(next);
    setAnnouncement(
      `${NAME[id]} moved to row ${to + 1} of ${next.length}, ${marksAbove(feedback(BIKE, next).count)}.`,
    );
  };
  const dragTo = (id: string, to: number) =>
    setOrder((prev) => {
      const from = prev.indexOf(id);
      return from === to ? prev : moveRow(prev, from, to);
    });
  const reset = () => setOrder(ALPHABETICAL);
  const best = () => setOrder(BEST.order);

  const label =
    shownView === "graph"
      ? `Dependency graph of ${BIKE.length} bike development activities with ${MARKS.length} dependencies; ${LOOP_TEXT}.`
      : `Design structure matrix in order ${shown.join(" ")}: ${marksAbove(count)}.${
          showBlock ? ` Coupled block ${BLOCK.join(" ")} spans ${blockSpan} rows.` : ""
        }`;

  const readouts =
    shownView === "graph" ? (
      <>
        <Readout label="Activities" value={BIKE.length} />
        <Readout label="Dependencies" value={MARKS.length} />
      </>
    ) : (
      <>
        <Readout label="Marks above diagonal" value={count} />
        {showBlock && <Readout label="Coupled block" value={blockSpan} format={rows} />}
      </>
    );

  const controls =
    beat === BEAT.see ? (
      <Segmented label="View" options={VIEWS} value={view} onChange={setView} />
    ) : beat === BEAT.partition ? (
      <>
        <Button variant="primary" onClick={best} disabled={same(order, BEST.order)}>
          Partition
        </Button>
        <Button onClick={reset} disabled={same(order, ALPHABETICAL)}>
          Reset to alphabetical
        </Button>
      </>
    ) : movable ? (
      <>
        <Button onClick={reset}>Reset to alphabetical</Button>
        <Button variant="primary" onClick={best}>
          Best order
        </Button>
      </>
    ) : undefined;

  return (
    <SceneFrame label={label} readouts={readouts} controls={controls}>
      <div ref={ref} data-canvas className="absolute inset-0">
        {shape && (
          <Morph
            view={shownView}
            shape={shape}
            slot={
              <AnimatePresence initial={false}>
                <motion.div
                  key={beat === BEAT.plan ? "plan" : "graph"}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                >
                  {beat === BEAT.plan ? <IterationPlan /> : <Graph rotated={shape.side} hot={hot} />}
                </motion.div>
              </AnimatePresence>
            }
            matrix={
              <Matrix
                order={shown}
                hot={hot}
                onHot={setHot}
                movable={movable}
                onDragMove={dragTo}
                onKeyMove={moveByKey}
                showBlock={showBlock}
                stressRework={beat === BEAT.rework}
                names={shape.names}
              />
            }
          />
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </SceneFrame>
  );
}
