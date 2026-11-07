"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
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
          <Term id="finish-to-start">Finish-to-start</Term>: each phase waits for the one before it
          to finish, so the house takes {days(sequential.planned)}. Nothing overlaps, so nothing is
          redone and the <Term id="expected">expected finish</Term> equals the{" "}
          <Term id="plan">plan</Term>.
        </>
      ),
    },
    {
      id: "drag",
      title: "Overlap saves days but invites rework.",
      body: (
        <>
          Drag {foundations.name} to start {days(halfway.saved)} before {design.name} ends. That{" "}
          <Term id="overlap">overlap</Term> moves the <Term id="plan">planned finish</Term>{" "}
          {days(halfway.saved)} sooner.
        </>
      ),
      predict: {
        prompt: `${foundations.name} starts ${days(halfway.saved)} early. On average, how much sooner does the house finish?`,
        options: [days(halfway.saved), days(halfway.net), "No sooner"],
        answer: 1,
        why: `${days(halfway.expectedRework)} of expected rework eats half the saving.`,
      },
    },
    {
      id: "risk",
      title: "Risk is the unfinished share of Design.",
      body: (
        <>
          When {foundations.name} starts {days(halfway.saved)} early, {pct(halfway.risk)} of{" "}
          {design.name} is still <Term id="unfinished">unfinished</Term>, so that is the chance its
          work changes. <Term id="rework">Expected rework</Term> is that chance times{" "}
          {days(halfway.saved)}: {days(halfway.expectedRework)}.
        </>
      ),
    },
    {
      id: "sweet-spot",
      title: "Every overlap has a sweet spot.",
      body: (
        <>
          <Term id="net">Net saving</Term> is overlap minus expected rework. It{" "}
          <Term id="sweet-spot">peaks</Term> at {days(best[0])}, half of {design.name}; overlap more
          and the point slides back down.
        </>
      ),
      why: (
        <>
          Risk grows with overlap, and so do the days at stake, so rework grows with the square.
          Early overlap days are nearly free; the last ones lose almost a full day each.
        </>
      ),
    },
    {
      id: "presets",
      title: "Overlap each phase by half its predecessor.",
      body: (
        <>
          Pick Max to overlap every phase as far as it goes. Then pick Balanced, which overlaps
          each phase by half its predecessor and expects {whole(balanced.expected)}.
        </>
      ),
      predict: {
        prompt: `Max overlap plans ${days(maxed.planned)}. Expected finish?`,
        options: [
          `About ${days(maxed.planned)}`,
          `Only a few days under ${days(sequential.expected)}`,
          "Later than sequential",
        ],
        answer: 1,
        why: `Rework adds about ${whole(maxed.expectedRework)} back.`,
      },
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
  recap: [
    { step: "Lay phases end to end; read the planned finish", beat: "sequential" },
    { step: "Start a successor early on partial information", beat: "drag" },
    { step: "Rate risk as how unfinished the predecessor is", beat: "risk" },
    { step: "Overlap until saved minus expected rework peaks", beat: "sweet-spot" },
    { step: "Repeat per handoff; judge the expected finish", beat: "presets" },
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
