"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { HIRING, HOURS_PER_DAY } from "@/engine/vsm/fixture";
import type { ImprovementId } from "@/engine/vsm/types";
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

export const lesson: Lesson = {
  meta: lessonBySlug("vsm"),
  beats: [
    {
      id: "map",
      title: "Map every step and every wait.",
      body: (
        <>
          The {HIRING.length} steps take {hours(current.processDays * HOURS_PER_DAY)} of work.
          Counting the waits between them, a hire takes {days(current.leadTimeDays)} from resume to
          offer.
        </>
      ),
    },
    {
      id: "ladder",
      title: "Most of the lead time is waiting.",
      body: (
        <>
          The ladder puts waits low and work high: {days(current.waitDays)} waiting,{" "}
          {days(current.processDays)} working. Work ÷ lead time, the process cycle efficiency, is
          only {percent(current.efficiency)}.
        </>
      ),
    },
    {
      id: "waste",
      title: "Name the waste behind each wait.",
      body: "Hover or focus a triangle. The waits come from weekly batches, handoffs, calendar alignment and an approval chain.",
    },
    {
      id: "future",
      title: "Cut the waits to design the future state.",
      body: (
        <>
          Turn on the first {FUTURE_A.length} improvements: lead time falls to{" "}
          {days(futureA.leadTimeDays)} and efficiency rises to {percent(futureA.efficiency)}. Add
          faster screens and the hire takes {days(futureB.leadTimeDays)} at{" "}
          {percent(futureB.efficiency)}.
        </>
      ),
    },
    {
      id: "work",
      title: "Faster work barely moves the date.",
      body: (
        <>
          With no improvements on, cut the onsite from {hours(ONSITE)} to {hours(FAST_ONSITE)}: lead
          time goes from {days(current.leadTimeDays)} to only {days(fastOnsite.leadTimeDays)}. The
          waits are the lever.
        </>
      ),
    },
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
