"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { Kbd } from "@/components/ui/kbd";
import { feedback, inputsOf, marks, partition } from "@/engine/dsm/dsm";
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
/** The prototype sits in the loop between Engineering and Testing. */
const middle = inputsOf(BIKE, loop.col)[0];

const name = (id: string) => BIKE.find((a) => a.id === id)!.name;
const list = (ids: string[]) =>
  ids.length > 1 ? `${ids.slice(0, -1).join(", ")} and ${ids.at(-1)}` : ids[0];
const rings = (n: number) => `${n} ring${n === 1 ? "" : "s"}`;
const options = [0, loops.count, alphabetical];

export const lesson: Lesson = {
  meta: lessonBySlug("dsm"),
  beats: [
    {
      id: "inputs",
      title: "Every arrow is an input a task needs.",
      body: (
        <>
          Hover or focus {name("E")}: it needs {list(inputsOf(BIKE, "E").map(name))}. The dashed
          arrow from {name(loop.col)} runs backwards: a <Term id="feedback">feedback</Term> arrow,
          because {name(loop.col)} happens after {name(loop.row)} yet feeds it.
        </>
      ),
      why: (
        <>
          Each arrow points from an output to the task that consumes it. {name(loop.col)} can only
          test a built {name(middle).toLowerCase()}, but what it finds changes the{" "}
          {name(loop.row).toLowerCase()}, so the arrow runs back.
        </>
      ),
    },
    {
      id: "matrix",
      title: "A matrix shows every input in one grid.",
      body: (
        <>
          Switch the view to Matrix: each activity becomes a <Term id="rows">row</Term> and a{" "}
          <Term id="columns">column</Term>. Read across <Term id="row-e">row E</Term>: its marks sit
          under {list(inputsOf(BIKE, "E"))}, the inputs {name("E")} needs.
        </>
      ),
    },
    {
      id: "diagonal",
      title: "The diagonal is the order of work.",
      body: (
        <>
          Rows and columns share one order, so the shaded <Term id="diagonal">diagonal</Term> is
          each task&apos;s own slot. A mark <Term id="below">left of it</Term> needs an earlier
          task; a mark <Term id="above">right of it</Term> needs a later one.
        </>
      ),
      why: (
        <>
          Left of the diagonal the input is finished before the row starts. Right of it the input
          does not exist yet, so the row starts on an assumption.
        </>
      ),
    },
    {
      id: "rework",
      title: "Right of the diagonal means rework.",
      body: (
        <>
          A <Term id="ring">ring</Term> marks a row that needs something planned later, so it
          starts on a guess and is redone. In alphabetical order {alphabetical} of {total} marks
          are rings; hover or focus one to find its edge.
        </>
      ),
    },
    {
      id: "partition",
      title: "Sort until only true loops remain.",
      body: (
        <>
          Press Partition to move every input ahead of the task that needs it. Any{" "}
          <Term id="loop">ring that remains</Term> is a true loop, so {list(block)} form one{" "}
          <Term id="block">coupled block</Term>.
        </>
      ),
      predict: {
        prompt: "Before you press Partition: how many rings can the best order leave?",
        options: options.map(String),
        answer: options.indexOf(loops.count),
        why: `${name(loop.col)} needs ${name(middle)}, which needs ${name(loop.row)}, which needs ${name(loop.col)}: a cycle, so one of them must go first.`,
      },
      why: (
        <>
          Partitioning only reorders. A cycle has no first task: whichever of {list(block)} goes
          first needs one planned later, so at least one ring always remains.
        </>
      ),
    },
    {
      id: "play",
      title: "Try it: drag rows, chase the count down.",
      body: (
        <>
          Drag a row by its header, or focus it and press <Kbd>Alt</Kbd>+<Kbd>↑</Kbd> or{" "}
          <Kbd>Alt</Kbd>+<Kbd>↓</Kbd>, to chase the <Term id="count">count</Term> down. Best order
          restores the partition and its {rings(loops.count)}.
        </>
      ),
    },
    {
      id: "plan",
      title: "Plan the loop as one iteration.",
      body: (
        <>
          Run {list(before)} <Term id="sequence">in sequence</Term>,{" "}
          <Term id="iterate">iterate</Term> {list(block)} in short cycles with close communication,
          then finish {list(after)}. Open the iterate chip to see the loop.
        </>
      ),
      why: (
        <>
          Inside the block, run short {block.join(" → ")} cycles so {name(loop.col)}&apos;s feedback
          returns in days, not after {name(after[0])} has started. Rework still happens, but each
          round is small.
        </>
      ),
    },
  ],
  recap: [
    { step: "List activities and the inputs each one needs", beat: "inputs" },
    { step: "Put them in a matrix: rows need columns", beat: "matrix" },
    { step: "Order rows; marks right of the diagonal are rework", beat: "rework" },
    { step: "Partition: move every input you can ahead", beat: "partition" },
    { step: "What stays is a coupled block: iterate it", beat: "plan" },
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
