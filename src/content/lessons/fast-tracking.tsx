"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { HOUSE, MAX_OVERLAP } from "@/engine/fast-tracking/fixture";
import { bestOverlaps, schedule } from "@/engine/fast-tracking/schedule";
import { days, pct } from "@/lib/format";
import { FastTrackingScene } from "@/scenes/fast-tracking/scene";
import { FastTrackingThumbnail } from "@/scenes/fast-tracking/thumbnail";
import type { Lesson } from "../types";
import { lessonBySlug } from "../meta";

const sequential = schedule([0, 0, 0]);
const best = bestOverlaps();
const balanced = schedule(best);
const maxed = schedule(MAX_OVERLAP);
const halfway = schedule([best[0], 0, 0]).edges[0];
const [design, foundations] = HOUSE;
const whole = (d: number) => days(Math.round(d), 0);

export const lesson: Lesson = {
  meta: lessonBySlug("fast-tracking"),
  beats: [
    {
      id: "sequential",
      title: "Finish-to-start is safe and slow.",
      body: (
        <>
          Each phase waits for the one before it to finish, so the house takes{" "}
          {days(sequential.planned)}. Nothing overlaps, so nothing is redone.
        </>
      ),
    },
    {
      id: "drag",
      title: "Overlap saves days but invites rework.",
      body: (
        <>
          Drag {foundations.name} to start {days(halfway.saved)} before {design.name} ends: you save{" "}
          {days(halfway.saved)}, but a {pct(halfway.risk)} chance of redoing that work means{" "}
          {days(halfway.expectedRework)} of expected rework.
        </>
      ),
    },
    {
      id: "sweet-spot",
      title: "Every overlap has a sweet spot.",
      body: (
        <>
          Net saving is overlap minus expected rework. It peaks at {days(best[0])}, half of{" "}
          {design.name}; overlap more and the point slides back down.
        </>
      ),
    },
    {
      id: "presets",
      title: "Overlap everything and you gain almost nothing.",
      body: (
        <>
          Max overlap expects {whole(maxed.expected)}, barely better than{" "}
          {days(sequential.expected)}. Balanced overlaps each phase by half its predecessor and
          expects {whole(balanced.expected)}.
        </>
      ),
    },
    {
      id: "try",
      title: "Try it: find your own balance.",
      body: (
        <>
          Drag all three phases and watch the risk rise. The best mix saves{" "}
          {days(sequential.expected - balanced.expected)} net; can you get within a day of it?
        </>
      ),
    },
  ],
  Scene: FastTrackingScene,
  Thumbnail: FastTrackingThumbnail,
  check: {
    question: `You overlap a ${design.days}-day predecessor by ${days(halfway.saved)}. Expected rework?`,
    options: [halfway.expectedRework / 2, halfway.expectedRework, halfway.expectedRework * 2].map(
      (d) => days(d),
    ),
    answer: 1,
    why: `Expected rework is a ${pct(halfway.risk)} chance of redoing ${days(halfway.saved)} of work.`,
  },
};

export default function FastTrackingLesson() {
  return <LessonShell lesson={lesson} />;
}
