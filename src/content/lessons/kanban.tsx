"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { limited, push } from "@/engine/kanban/config";
import { DAYS, LIMIT, OUTAGE, OUTAGE_DAYS, REQUESTS, VARIABILITY } from "@/engine/kanban/fixture";
import { flowAt } from "@/engine/kanban/flow";
import { limitSweep } from "@/engine/kanban/sweep";
import { simulateLine } from "@/lib/line-sim";
import { KanbanScene } from "@/scenes/kanban/scene";
import { KanbanThumbnail } from "@/scenes/kanban/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const last = DAYS - 1;
const pushEnd = flowAt(simulateLine(push()), last);
const limitedEnd = flowAt(simulateLine(limited(LIMIT)), last);
const outageRun = simulateLine(limited(LIMIT, 0, OUTAGE));
const outageFlow = outageRun.ticks.map((_, t) => flowAt(outageRun, t).throughput);
const steady = limitSweep(0);
const noisy = limitSweep(VARIABILITY);

const one = (n: number) => Math.round(n * 10) / 10;
const two = (n: number) => n.toFixed(2);

export const lesson: Lesson = {
  meta: lessonBySlug("kanban"),
  beats: [
    {
      id: "push",
      title: "Push: everything starts, little finishes.",
      body: (
        <>
          {REQUESTS} requests arrive a day and all of them start, but only {one(pushEnd.throughput)} finish. By day{" "}
          {DAYS}, {pushEnd.wip} items crowd the board and each takes {one(pushEnd.cycleTime)} days, rising.
        </>
      ),
    },
    {
      id: "limit",
      title: "Limit WIP: cycle time falls, throughput holds.",
      body: (
        <>
          Each column now holds at most {LIMIT} items, and nothing new starts until there is room. WIP settles at{" "}
          {limitedEnd.wip}, throughput stays {one(limitedEnd.throughput)} a day and cycle time drops to{" "}
          {one(limitedEnd.cycleTime)} days.
        </>
      ),
    },
    {
      id: "little",
      title: "Little’s law: cycle time = WIP ÷ throughput.",
      body: (
        <>
          On the cumulative flow diagram, the vertical gap between arrivals and departures is WIP and the horizontal
          gap is cycle time: {limitedEnd.wip} ÷ {one(limitedEnd.throughput)} = {one(limitedEnd.cycleTime)} days.
        </>
      ),
    },
    {
      id: "outage",
      title: "A blocked column stops the ones before it.",
      body: (
        <>
          With Test down for {OUTAGE_DAYS} days, Build and Analyse fill to their limits and stop pulling, so the
          problem is plain to see. Throughput dips to {one(Math.min(...outageFlow.slice(OUTAGE.from)))} a day,
          then recovers to {one(outageFlow[last])}.
        </>
      ),
    },
    {
      id: "sweep",
      title: "Try it: tight, but not starving.",
      body: (
        <>
          At limit {steady[0].limit} throughput halves to {one(steady[0].throughput)}; at {steady[1].limit}, cycle
          time hits its {one(steady[1].cycleTime)}-day floor. With variability on, {noisy[1].limit} starves at{" "}
          {two(noisy[1].throughput)} a day while {noisy[2].limit} keeps {two(noisy[2].throughput)}.
        </>
      ),
    },
  ],
  Scene: KanbanScene,
  Thumbnail: KanbanThumbnail,
  check: {
    question: `Throughput stays at ${one(limitedEnd.throughput)} per day and WIP halves. Cycle time…`,
    options: ["halves", "stays", "doubles"],
    answer: 0,
    why: "By Little’s law, half the WIP at the same throughput halves cycle time.",
  },
};

export default function KanbanLesson() {
  return <LessonShell lesson={lesson} />;
}
