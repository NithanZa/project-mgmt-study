"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { limited, push } from "@/engine/kanban/config";
import { BOARD, DAYS, LIMIT, OUTAGE, OUTAGE_DAYS, REQUESTS, VARIABILITY } from "@/engine/kanban/fixture";
import { flowAt } from "@/engine/kanban/flow";
import { limitSweep } from "@/engine/kanban/sweep";
import { drumIndex, simulateLine } from "@/lib/line-sim";
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
/** Build, the slowest column. */
const buildCap = BOARD[drumIndex(BOARD)].capacity;

const one = (n: number) => Math.round(n * 10) / 10;
const two = (n: number) => n.toFixed(2);
/** 0 if `after` is lower than `before`, 1 if it rounds the same, 2 if higher. */
const trend = (before: number, after: number) =>
  one(after) < one(before) ? 0 : one(after) === one(before) ? 1 : 2;

export const lesson: Lesson = {
  meta: lessonBySlug("kanban"),
  beats: [
    {
      id: "push",
      title: "Push: everything starts, little finishes.",
      body: (
        <>
          {REQUESTS} requests arrive a day and all of them start, but only {one(pushEnd.throughput)}{" "}
          <Term id="finish">finish</Term>. By day {DAYS}, {pushEnd.wip} items{" "}
          <Term id="wip">crowd the board</Term> and <Term id="age">each takes</Term> {one(pushEnd.cycleTime)} days,
          rising.
        </>
      ),
      why: (
        <>
          Build finishes only {buildCap} a day, so everything behind it waits. Starting more doesn’t finish more; it
          only lengthens the queue.
        </>
      ),
    },
    {
      id: "limit",
      title: "Limit WIP and cycle time falls.",
      body: (
        <>
          Each column now holds <Term id="limit">at most {LIMIT}</Term> items, and nothing new starts until there is{" "}
          <Term id="room">room</Term>. WIP settles at {limitedEnd.wip} and cycle time drops to{" "}
          {one(limitedEnd.cycleTime)} days.
        </>
      ),
      predict: {
        prompt: `Cap every column at ${LIMIT} items. Throughput will…`,
        options: ["fall", `stay at ${one(pushEnd.throughput)}`, "rise"],
        answer: trend(pushEnd.throughput, limitedEnd.throughput),
        why: `Build still finishes ${buildCap} a day; only its queue shrinks.`,
      },
      why: (
        <>
          Extra requests wait in the backlog, not on the board, and the clock starts when work is pulled. Fewer items
          in line means each waits less.
        </>
      ),
    },
    {
      id: "cfd",
      title: "The flow diagram stacks every column over time.",
      body: (
        <>
          Each <Term id="band">band</Term> is one column’s items, day by day. The top edge counts{" "}
          <Term id="arrivals">arrivals</Term>, the dark line counts <Term id="done">finished work</Term>.
        </>
      ),
    },
    {
      id: "little",
      title: "Little’s law: cycle time = WIP ÷ throughput.",
      body: (
        <>
          The <Term id="wip">vertical gap</Term> between arrivals and done is WIP; the{" "}
          <Term id="cycle-time">horizontal gap</Term> is cycle time. Divide WIP by{" "}
          <Term id="throughput">throughput</Term>, the done line’s slope: {limitedEnd.wip} ÷{" "}
          {one(limitedEnd.throughput)} = {one(limitedEnd.cycleTime)} days.
        </>
      ),
      why: (
        <>
          Items leave at the throughput rate, so the last arrival waits for everyone ahead of it: WIP ÷ throughput =
          days in the system.
        </>
      ),
    },
    {
      id: "outage",
      title: "A stopped column surfaces the problem.",
      body: (
        <>
          Press <Term id="down">Test down</Term> for {OUTAGE_DAYS} days. A column that has to{" "}
          <Term id="blocked">stop pulling</Term> shows a waiting band. Throughput dips to{" "}
          {one(Math.min(...outageFlow.slice(OUTAGE.from)))} a day, then recovers to {one(outageFlow[last])}.
        </>
      ),
      predict: {
        prompt: `Test stops for ${OUTAGE_DAYS} days. Analyse and Build will…`,
        options: ["keep starting work", `fill to ${LIMIT} and stop`],
        answer: 1,
        why: "Nothing can move into a full column.",
      },
      why: (
        <>
          The stop is the point: with nothing to start, the team helps fix Test instead of hiding the problem under
          half-done work.
        </>
      ),
    },
    {
      id: "sweep",
      title: "Try it: tight, but not starving.",
      body: (
        <>
          At limit {steady[0].limit} throughput halves to {one(steady[0].throughput)}; at {steady[1].limit}, cycle
          time hits its {one(steady[1].cycleTime)}-day <Term id="floor">floor</Term>. With variability on,{" "}
          {noisy[1].limit} <Term id="starves">starves</Term> at {two(noisy[1].throughput)} a day while{" "}
          {noisy[2].limit} keeps {two(noisy[2].throughput)}.
        </>
      ),
      why: (
        <>
          A column can’t finish more than it holds. At limit {steady[0].limit} Build holds {steady[0].limit} item, so
          it finishes {one(steady[0].throughput)} a day despite capacity {buildCap}.
        </>
      ),
    },
  ],
  recap: [
    { step: "Put each stage of work in its own column", beat: "push" },
    { step: "Cap each column; pull only when there’s room", beat: "limit" },
    { step: "Track WIP, throughput and cycle time on a CFD", beat: "cfd" },
    { step: "When a column blocks, swarm the blocker", beat: "outage" },
    { step: "Lower limits until throughput falls, then step back", beat: "sweep" },
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
