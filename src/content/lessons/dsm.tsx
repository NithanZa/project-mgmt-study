"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Kbd } from "@/components/ui/kbd";
import { feedback, marks, partition } from "@/engine/dsm/dsm";
import { ALPHABETICAL, BIKE } from "@/engine/dsm/fixture";
import { DsmScene } from "@/scenes/dsm/scene";
import { DsmThumbnail } from "@/scenes/dsm/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const total = marks(BIKE).length;
const alphabetical = feedback(BIKE, ALPHABETICAL).count;
const best = partition(BIKE);
const loops = feedback(BIKE, best.order);
const loop = loops.marks[0];
const block = best.blocks[0];
const before = best.order.slice(0, best.order.indexOf(block[0]));
const after = best.order.slice(best.order.indexOf(block.at(-1)!) + 1);

const name = (id: string) => BIKE.find((a) => a.id === id)!.name;
const list = (ids: string[]) =>
  ids.length > 1 ? `${ids.slice(0, -1).join(", ")} and ${ids.at(-1)}` : ids[0];
const rings = (n: number) => `${n} ring${n === 1 ? "" : "s"}`;

export const lesson: Lesson = {
  meta: lessonBySlug("dsm"),
  beats: [
    {
      id: "matrix",
      title: "A graph hides what a matrix shows.",
      body: (
        <>
          Switch the view to Matrix: each activity becomes a row and a column, and a mark shows what
          the row needs. In alphabetical order, {alphabetical} of {total} marks sit above the
          diagonal.
        </>
      ),
    },
    {
      id: "rework",
      title: "Above the diagonal means rework.",
      body: (
        <>
          A ring marks a row that needs something planned later, so it starts on a guess and gets
          redone. Hover or focus a ring to find its edge in the graph.
        </>
      ),
    },
    {
      id: "partition",
      title: "Sort until only true loops remain.",
      body: (
        <>
          Press Partition to move every input ahead of the task that needs it.{" "}
          {rings(loops.count)} remain
          {loops.count === 1 ? "s" : ""}: {name(loop.col)} ({loop.col}) feeds back into{" "}
          {name(loop.row)} ({loop.row}), so {list(block)} form one coupled block.
        </>
      ),
    },
    {
      id: "play",
      title: "Try it: drag rows, chase the count down.",
      body: (
        <>
          Drag a row by its header, or focus the header and press <Kbd>Alt</Kbd>+<Kbd>↑</Kbd> or{" "}
          <Kbd>Alt</Kbd>+<Kbd>↓</Kbd>. Best order restores the partition and its{" "}
          {rings(loops.count)}.
        </>
      ),
    },
    {
      id: "plan",
      title: "Plan the loop as one iteration.",
      body: (
        <>
          Run {list(before)} in sequence, iterate {list(block)} in short cycles with close
          communication, then finish {list(after)}. Open the iterate chip to see the loop.
        </>
      ),
    },
  ],
  Scene: DsmScene,
  Thumbnail: DsmThumbnail,
  check: {
    question: "A mark above the diagonal means…",
    options: [
      "The task is critical",
      "The task depends on one planned after it",
      "The task has float",
    ],
    answer: 1,
    why: "Its input arrives late, forcing a redo.",
  },
};

export default function DsmLesson() {
  return <LessonShell lesson={lesson} />;
}
