"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { INSURED, ROPE, STARVED, TRY_IT, drum, push } from "@/engine/dbr/config";
import { DAYS, ORDERS, SHOP, WELD_INDEX } from "@/engine/dbr/fixture";
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
const weldCapacity = SHOP[WELD_INDEX].capacity;
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
          Orders arrive at {ORDERS} a day, but <Term id="drum">Weld, the drum</Term>, ships only{" "}
          {one(pushed.throughput)}. By day {DAYS}, {pile} <Term id="pile">items wait</Term> in front of it
          and cycle time is {one(pushed.cycleTime)} days.
        </>
      ),
      why: (
        <>
          Weld makes only {weldCapacity} a day, so it sets the pace for the whole shop: the drum.
          Releasing more than that just grows the pile.
        </>
      ),
    },
    {
      id: "rope",
      title: "The rope releases only what the drum consumed.",
      body: (
        <>
          With a <Term id="buffer">buffer</Term> of {ROPE.bufferTarget}, the <Term id="rope">rope</Term>{" "}
          lets the <Term id="gate">release gate</Term> admit only{" "}
          <Term id="consumed">what Weld has used</Term>. Throughput stays {one(roped.throughput)}, while
          WIP falls from {whole(pushed.wip)} to {one(roped.wip)} and cycle time from{" "}
          {one(pushed.cycleTime)} to {one(roped.cycleTime)} days.
        </>
      ),
      why: (
        <>
          Each day the gate releases target minus items already at Cut and Weld. Weld still gets all it
          can weld; orders wait outside, where they cost nothing.
        </>
      ),
    },
    {
      id: "starved",
      title: "A noisy feed starves the drum.",
      body: (
        <>
          Now every station&rsquo;s daily capacity <Term id="noise">swings</Term> by up to{" "}
          {noise(STARVED.variability)}. Watch the buffer of {STARVED.bufferTarget}: the gauge flashes on
          each day it <Term id="starved">runs dry</Term>.
        </>
      ),
      predict: {
        prompt: "Capacities now swing daily but average the same. Weld’s output…",
        options: [`stays ${one(roped.throughput)}`, "falls"],
        answer: starved.throughput < roped.throughput ? 1 : 0,
        why: "Days Weld sits idle can’t be made up; it has no spare capacity.",
      },
    },
    {
      id: "insured",
      title: "The buffer is the drum's insurance.",
      body: (
        <>
          With a buffer of {INSURED.bufferTarget}, Weld is {pct(insured.drumUtilization)}{" "}
          <Term id="busy-line">busy</Term> and ships {two(insured.throughput)} a day, at{" "}
          {one(insured.cycleTime)} days of <Term id="cycle-line">cycle time</Term>. Past this{" "}
          <Term id="knee">knee</Term>, more buffer buys little.
        </>
      ),
      why: (
        <>
          A bigger buffer means more items queue, so cycle time keeps rising. Past the knee Weld is
          almost never starved, so extra items buy almost no output.
        </>
      ),
    },
    {
      id: "try",
      title: "Find the smallest buffer that feeds the drum.",
      body: (
        <>
          Set the noise, then shrink the buffer until Weld&rsquo;s <Term id="busy-line">busy line</Term>{" "}
          starts to fall. At {noise(TRY_IT.variability)}, every three extra items add {one(perThree)} days
          of cycle time.
        </>
      ),
    },
  ],
  recap: [
    { step: "Find the slowest station: the drum", beat: "push" },
    { step: "Release work only as the drum consumes it", beat: "rope" },
    { step: "Expect variation to starve it", beat: "starved" },
    { step: "Hold a buffer in front of the drum", beat: "insured" },
    { step: "Size it at the knee", beat: "try" },
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
