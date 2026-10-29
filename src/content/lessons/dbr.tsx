"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { INSURED, ROPE, STARVED, TRY_IT, drum, push } from "@/engine/dbr/config";
import { DAYS, ORDERS, WELD_INDEX } from "@/engine/dbr/fixture";
import { BUFFER_MAX, BUFFER_MIN, bufferSweep, meansOverSeeds } from "@/engine/dbr/sweep";
import { pct } from "@/lib/format";
import { simulateLine } from "@/lib/line-sim";
import { DbrScene } from "@/scenes/dbr/scene";
import { DbrThumbnail } from "@/scenes/dbr/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const pushed = meansOverSeeds(push());
const pile = simulateLine(push()).ticks[DAYS - 1].queues[WELD_INDEX];
const roped = meansOverSeeds(drum(ROPE.bufferTarget, ROPE.variability));
const starved = meansOverSeeds(drum(STARVED.bufferTarget, STARVED.variability));
const insured = meansOverSeeds(drum(INSURED.bufferTarget, INSURED.variability));
const trySweep = bufferSweep(TRY_IT.variability);
const perThree =
  ((trySweep[trySweep.length - 1].cycleTime - trySweep[0].cycleTime) * 3) / (BUFFER_MAX - BUFFER_MIN);

const one = (n: number) => Math.round(n * 10) / 10;
const two = (n: number) => Math.round(n * 100) / 100;
const whole = Math.round;
const noise = (v: number) => `±${Math.round(v * 100)}%`;

export const lesson: Lesson = {
  meta: lessonBySlug("dbr"),
  beats: [
    {
      id: "push",
      title: "Pushed work piles up before the drum.",
      body: (
        <>
          Orders arrive at {ORDERS} a day, but Weld, the drum, ships only {one(pushed.throughput)}. By
          day {DAYS}, {pile} items wait in front of it and cycle time is {one(pushed.cycleTime)} days.
        </>
      ),
    },
    {
      id: "rope",
      title: "The rope releases only what the drum consumed.",
      body: (
        <>
          With a buffer of {ROPE.bufferTarget}, the release gate lets in only what Weld has used.
          Throughput stays {one(roped.throughput)}, while WIP falls from {whole(pushed.wip)} to {one(roped.wip)}{" "}
          and cycle time from {one(pushed.cycleTime)} to {one(roped.cycleTime)} days.
        </>
      ),
    },
    {
      id: "starved",
      title: "A noisy feed starves the drum.",
      body: (
        <>
          Now every station&rsquo;s daily capacity swings by up to {noise(STARVED.variability)}. The
          buffer of {STARVED.bufferTarget} runs dry, the gauge flashes, and Weld is busy only{" "}
          {pct(starved.drumUtilization)}, shipping {two(starved.throughput)} a day.
        </>
      ),
    },
    {
      id: "insured",
      title: "The buffer is the drum's insurance.",
      body: (
        <>
          With a buffer of {INSURED.bufferTarget}, Weld is {pct(insured.drumUtilization)} busy and ships{" "}
          {two(insured.throughput)} a day, at {one(insured.cycleTime)} days of cycle time. Past this
          knee, more buffer buys little.
        </>
      ),
    },
    {
      id: "try",
      title: "Find the smallest buffer that feeds the drum.",
      body: (
        <>
          Set the noise, then shrink the buffer until Weld&rsquo;s busy line starts to fall. At{" "}
          {noise(TRY_IT.variability)}, every three extra items add {one(perThree)} days of cycle
          time.
        </>
      ),
    },
  ],
  Scene: DbrScene,
  Thumbnail: DbrThumbnail,
  check: {
    question: "What does the rope control?",
    options: ["The drum's speed", "When work is released into the line", "The paint station"],
    answer: 1,
    why: "It ties release to what the drum has consumed.",
  },
};

export default function DbrLesson() {
  return <LessonShell lesson={lesson} />;
}
