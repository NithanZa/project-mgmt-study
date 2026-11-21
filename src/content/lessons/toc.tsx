"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { BAKERY, CLEANING_LOSS, DEMAND, HOURS, OVEN } from "@/engine/toc/fixture";
import { baseline, elevate, exploitLoss, investDeltas, subordinate } from "@/engine/toc/scenarios";
import { pct } from "@/lib/format";
import { MARKET, simulateLine } from "@/lib/line-sim";
import { TocScene } from "@/scenes/toc/scene";
import { TocThumbnail } from "@/scenes/toc/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const OVEN_INDEX = BAKERY.findIndex((s) => s.id === OVEN);
const ovenCapacity = BAKERY[OVEN_INDEX].capacity;
const push = simulateLine(baseline());
const loss = simulateLine(exploitLoss(baseline(), true));
const paced = simulateLine(subordinate(baseline()));
const doubledConfig = elevate(baseline(), OVEN, 2);
const doubled = simulateLine(doubledConfig);
const doubledOvenCapacity = doubledConfig.stations[OVEN_INDEX].capacity;
const deltas = investDeltas();

const one = (n: number) => Math.round(n * 10) / 10;
const whole = Math.round;

/** Pacing release changes output by less than a tenth of a loaf: it stays. */
const pacedAnswer = Math.sign(one(paced.throughput) - one(push.throughput)) + 1;
const proofDelta = whole(deltas.proof);
const proofAnswer = proofDelta === 0 ? 0 : proofDelta === whole(deltas[OVEN]) ? 1 : 2;
const CHECK_OPTIONS = ["Proof", "The market", "Pack"];
const checkAnswer =
  doubled.constraint === MARKET ? 1 : CHECK_OPTIONS.indexOf(BAKERY.find((s) => s.id === doubled.constraint)!.name);

export const lesson: Lesson = {
  meta: lessonBySlug("toc"),
  beats: [
    {
      id: "pace",
      title: "The oven sets the whole bakery’s pace.",
      body: (
        <>
          Orders arrive at <Term id="orders">{DEMAND} an hour</Term>, but only {one(push.throughput)}{" "}
          <Term id="throughput">loaves come out</Term>; each dial is{" "}
          <Term id="capacity">capacity an hour</Term>. Watch where the dough{" "}
          <Term id="pile">piles up</Term>.
        </>
      ),
    },
    {
      id: "identify",
      title: "Identify: the constraint is where work waits.",
      body: (
        <>
          The oven is the <Term id="constraint">constraint</Term>: {pct(push.utilization[OVEN_INDEX])}{" "}
          <Term id="busy">busy</Term>, with{" "}
          {push.ticks[HOURS - 1].queues[OVEN_INDEX] - ovenCapacity} loaves waiting by hour {HOURS}.
          Every other station has spare capacity it cannot use.
        </>
      ),
    },
    {
      id: "exploit",
      title: "Exploit the constraint before you spend.",
      body: (
        <>
          Cleaning that takes {pct(CLEANING_LOSS)} of oven time cuts output to {one(loss.throughput)}:
          stop the loss first.
        </>
      ),
      why: (
        <>
          The oven has no spare hours, so any hour it loses is lost to the whole bakery. Stations with
          slack can recover a lost hour; the constraint can&rsquo;t.
        </>
      ),
    },
    {
      id: "subordinate",
      title: "Subordinate: feed the oven, not the queue.",
      body: (
        <>
          <Term id="release">Releasing</Term> dough at the oven&rsquo;s pace drains its pile:{" "}
          <Term id="cycle-time">cycle time</Term> falls from {one(push.avgCycleTime)} to{" "}
          {one(paced.avgCycleTime)} h and <Term id="wip">WIP</Term> from {whole(push.avgWip)} to{" "}
          {whole(paced.avgWip)}.
        </>
      ),
      why: (
        <>
          Every loaf released early just queues before the oven, adding hours to cycle time. Every
          other station has slack, so pacing to the oven costs nothing.
        </>
      ),
      predict: {
        prompt: "Release dough only as fast as the oven bakes. Output will…",
        options: ["fall", `stay at ${one(push.throughput)}`, "rise"],
        answer: pacedAnswer,
        why: "The oven was already the limit; extra dough only waited.",
      },
    },
    {
      id: "elevate",
      title: "Elevate where it moves throughput.",
      body: (
        <>
          Output is {one(push.throughput)} an hour. Press a station to give it +50% capacity; its badge
          shows how output changes. Try the <Term id="elevate">oven</Term> too.
        </>
      ),
      predict: {
        prompt: "Proof gets +50% capacity. Bakery output rises by…",
        options: ["0", `about ${whole(deltas[OVEN])} an hour`, "+50%"],
        answer: proofAnswer,
        why: `Proof was never the limit; the oven still bakes ${ovenCapacity} an hour.`,
      },
    },
    {
      id: "repeat",
      title: "Repeat: the constraint moves.",
      body: (
        <>
          Double the oven and output reaches {one(doubled.throughput)}, every order there is, with the
          oven only {pct(doubled.utilization[OVEN_INDEX])} busy. Click a tile to pick the station the
          slider changes, and find the next constraint.
        </>
      ),
      why: (
        <>
          With the oven at {doubledOvenCapacity}, every station can make more than the {DEMAND} orders
          an hour. Demand now limits output.
        </>
      ),
    },
  ],
  recap: [
    { step: "Find where work piles up: the constraint", beat: "identify" },
    { step: "Stop losing constraint time", beat: "exploit" },
    { step: "Release work at the constraint’s pace", beat: "subordinate" },
    { step: "Only then add capacity at the constraint", beat: "elevate" },
    { step: "Check where the constraint moved; repeat", beat: "repeat" },
  ],
  Scene: TocScene,
  Thumbnail: TocThumbnail,
  check: {
    question: "Doubling the oven moves the constraint to…",
    options: CHECK_OPTIONS,
    answer: checkAnswer,
    why: "Demand is now below every station's capacity.",
  },
};

export default function TocLesson() {
  return <LessonShell lesson={lesson} />;
}
