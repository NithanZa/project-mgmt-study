"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { HIRING, HOURS_PER_DAY } from "@/engine/vsm/fixture";
import type { ImprovementId, Step } from "@/engine/vsm/types";
import { applyImprovements, summary, withProcessHours } from "@/engine/vsm/vsm";
import { days } from "@/lib/format";
import { hours, percent } from "@/scenes/vsm/format";
import { ONSITE, VsmScene } from "@/scenes/vsm/scene";
import { VsmThumbnail } from "@/scenes/vsm/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const FUTURE_A: ImprovementId[] = [
  "takeHomeFastReview",
  "onsiteWithinTwoDays",
  "sameDayDebrief",
  "offerApprovalOneDay",
];
const FAST_ONSITE = 2;

const current = summary(HIRING);
const futureA = summary(applyImprovements(HIRING, FUTURE_A));
const futureB = summary(applyImprovements(HIRING, [...FUTURE_A, "screensWithinOneDay"]));
const fastOnsite = summary(withProcessHours(HIRING, "onsite", FAST_ONSITE));

/** The predict on `future`: cap the onsite wait, or halve the onsite work? */
const onsiteWait = (steps: readonly Step[]) =>
  steps.find((s) => s.id === "onsite")!.waitDays;
const ONSITE_CAP: ImprovementId = "onsiteWithinTwoDays";
const cappedOnsite = applyImprovements(HIRING, [ONSITE_CAP]);
const capLead = summary(cappedOnsite).leadTimeDays;
const halfLead = summary(withProcessHours(HIRING, "onsite", ONSITE / 2)).leadTimeDays;

export const lesson: Lesson = {
  meta: lessonBySlug("vsm"),
  beats: [
    {
      id: "map",
      title: "Map every step and every wait.",
      body: (
        <>
          The {HIRING.length} <Term id="steps">steps</Term> take{" "}
          {hours(current.processDays * HOURS_PER_DAY)} of <Term id="work">work</Term>. Counting the{" "}
          <Term id="waits">waits</Term> between them, a hire takes {days(current.leadTimeDays)} from{" "}
          <Term id="lead-time">resume to offer</Term>.
        </>
      ),
      why: (
        <>
          A triangle marks work waiting before a step, one dot per day. Work hours become days at{" "}
          {HOURS_PER_DAY} h a day, so both share one timeline.
        </>
      ),
    },
    {
      id: "ladder",
      title: "Most of the lead time is waiting.",
      body: (
        <>
          The ladder puts <Term id="wait-rungs">waits low</Term> and{" "}
          <Term id="work-rungs">work high</Term>: {days(current.waitDays)} waiting,{" "}
          {days(current.processDays)} working. Work ÷ lead time, the{" "}
          <Term id="pce">process cycle efficiency</Term>, is only {percent(current.efficiency)}.
        </>
      ),
      why: (
        <>
          The candidate lives through the lead time, not the work time. Each waiting day is a day a
          rival can make an offer.
        </>
      ),
    },
    {
      id: "waste",
      title: "Name the waste behind each wait.",
      body: (
        <>
          Hover or focus a triangle. The waits come from <Term id="batching">weekly batches</Term>,{" "}
          <Term id="handoff">handoffs</Term>, <Term id="waiting">calendar alignment</Term> and{" "}
          <Term id="approval">an approval chain</Term>.
        </>
      ),
    },
    {
      id: "future",
      title: "Cut the waits to design the future state.",
      body: (
        <>
          Turn on the first {FUTURE_A.length} <Term id="improvements">improvements</Term>: lead time{" "}
          <Term id="baseline">falls to</Term> {days(futureA.leadTimeDays)} and efficiency rises to{" "}
          {percent(futureA.efficiency)}. Add faster screens and the hire takes{" "}
          {days(futureB.leadTimeDays)} at {percent(futureB.efficiency)}.
        </>
      ),
      predict: {
        prompt: "Which cut shortens the hire most?",
        options: [`Capping the onsite wait at ${days(onsiteWait(cappedOnsite))}`, "Halving the onsite work"],
        answer: capLead < halfLead ? 0 : 1,
        why: `That wait is ${days(onsiteWait(HIRING))}; the onsite is ${hours(ONSITE)}.`,
      },
      why: (
        <>
          Each cap removes a batch, handoff or approval delay; the work itself is unchanged. Biggest
          waits first gives the most days back.
        </>
      ),
    },
    {
      id: "work",
      title: "Faster work barely moves the date.",
      body: (
        <>
          The improvements are off again. Cut the <Term id="onsite">onsite</Term> from{" "}
          {hours(ONSITE)} to {hours(FAST_ONSITE)}: lead time goes from {days(current.leadTimeDays)} to
          only {days(fastOnsite.leadTimeDays)}. The waits are the lever.
        </>
      ),
    },
  ],
  recap: [
    { step: "Walk the process; record each step's work time", beat: "map" },
    { step: "Record the wait before every step", beat: "map" },
    { step: "Lay both on a timeline; compute lead time and efficiency", beat: "ladder" },
    { step: "Name the waste causing each wait", beat: "waste" },
    { step: "Design a future state that cuts the biggest waits", beat: "future" },
    { step: "Speed up work last", beat: "work" },
  ],
  Scene: VsmScene,
  Thumbnail: VsmThumbnail,
  check: {
    question: "Process cycle efficiency is…",
    options: ["lead time ÷ process time", "process time ÷ lead time", "waits ÷ steps"],
    answer: 1,
    why: "It is the share of lead time spent working.",
  },
};

export default function VsmLesson() {
  return <LessonShell lesson={lesson} />;
}
