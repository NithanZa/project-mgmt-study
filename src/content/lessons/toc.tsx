"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { BAKERY, CLEANING_LOSS, DEMAND, HOURS, OVEN } from "@/engine/toc/fixture";
import { baseline, elevate, exploitLoss, invest, subordinate } from "@/engine/toc/scenarios";
import { pct } from "@/lib/format";
import { simulateLine } from "@/lib/line-sim";
import { TocScene } from "@/scenes/toc/scene";
import { TocThumbnail } from "@/scenes/toc/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const OVEN_INDEX = BAKERY.findIndex((s) => s.id === OVEN);
const push = simulateLine(baseline());
const loss = simulateLine(exploitLoss(baseline(), true));
const paced = simulateLine(subordinate(baseline()));
const doubled = simulateLine(elevate(baseline(), OVEN, 2));
const output = (stationId: string) => simulateLine(invest(baseline(), stationId)).throughput;

const one = (n: number) => Math.round(n * 10) / 10;
const whole = Math.round;

export const lesson: Lesson = {
  meta: lessonBySlug("toc"),
  beats: [
    {
      id: "pace",
      title: "The oven sets the whole bakery’s pace.",
      body: (
        <>
          Orders arrive at {DEMAND} an hour, but only {one(push.throughput)} loaves come out. Watch
          where the dough piles up.
        </>
      ),
    },
    {
      id: "identify",
      title: "Identify: the constraint is where work waits.",
      body: (
        <>
          The oven runs {pct(push.utilization[OVEN_INDEX])} busy with{" "}
          {push.ticks[HOURS - 1].queues[OVEN_INDEX] - BAKERY[OVEN_INDEX].capacity} loaves waiting by
          hour {HOURS}. Every other station has spare capacity it cannot use.
        </>
      ),
    },
    {
      id: "exploit",
      title: "Exploit and subordinate before you spend.",
      body: (
        <>
          Cleaning that takes {pct(CLEANING_LOSS)} of oven time cuts output to{" "}
          {one(loss.throughput)}: stop the loss first. Releasing dough at the oven&rsquo;s pace keeps{" "}
          {one(paced.throughput)} an hour, yet cycle time falls from {one(push.avgCycleTime)} to{" "}
          {one(paced.avgCycleTime)} h and WIP from {whole(push.avgWip)} to {whole(paced.avgWip)}.
        </>
      ),
    },
    {
      id: "elevate",
      title: "Elevate where it moves throughput.",
      body: (
        <>
          Invest +50% in Pack and output stays {one(output("pack"))}; in Proof, {one(output("proof"))}.
          In the oven it rises to {one(output(OVEN))}, because only the constraint&rsquo;s capacity
          reaches customers.
        </>
      ),
    },
    {
      id: "repeat",
      title: "Repeat: the constraint moves.",
      body: (
        <>
          Double the oven and output reaches {one(doubled.throughput)}, every order there is, with
          the oven only {pct(doubled.utilization[OVEN_INDEX])} busy. The market is now the
          constraint; find the next one and start again.
        </>
      ),
    },
  ],
  Scene: TocScene,
  Thumbnail: TocThumbnail,
  check: {
    question: "Doubling a non-constraint's capacity raises throughput by…",
    options: ["0", "Half its gain", "Its full gain"],
    answer: 0,
    why: "Output is set by the constraint.",
  },
};

export default function TocLesson() {
  return <LessonShell lesson={lesson} />;
}
