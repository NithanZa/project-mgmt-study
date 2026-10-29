"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { CriticalChainScene } from "@/scenes/critical-chain/scene";
import { CriticalChainThumbnail } from "@/scenes/critical-chain/thumbnail";
import {
  CHAINS,
  COMMITTED,
  FEASIBLE_FLOAT,
  HALF,
  RSS,
  SAFE,
  UNCONSTRAINED,
  firstCmsOverrun,
  nameOf,
  names,
} from "@/scenes/critical-chain/model";
import type { Lesson } from "../types";
import { lessonBySlug } from "../meta";

const feeding = HALF.feeding[0];
const [floating, floatDays] = Object.entries(FEASIBLE_FLOAT)[0];

export const lesson: Lesson = {
  meta: lessonBySlug("critical-chain"),
  beats: [
    {
      id: "padding",
      title: "Everyone pads, and the padding gets used anyway.",
      body: (
        <>
          Each pale bar is a padded estimate around a dark 50% core. The critical path says{" "}
          {UNCONSTRAINED.makespan} days, yet Pages and CMS need the one developer at the same time.
        </>
      ),
    },
    {
      id: "chain",
      title: "The chain follows people, not only arrows.",
      body: (
        <>
          With CMS before Pages the developer finishes in {SAFE.makespan} days. The critical chain
          runs {names(CHAINS.feasible.ids)} through the dashed resource link, and{" "}
          {nameOf(floating)} gets {floatDays} days of float.
        </>
      ),
    },
    {
      id: "buffers",
      title: "Cut the padding, pool the safety.",
      body: (
        <>
          Plan on the 50% cores and pool the removed safety: {HALF.project.days} days at the end,{" "}
          {feeding.days} where {nameOf(feeding.from)} feeds {nameOf(feeding.before)}. We commit to
          day {COMMITTED.half} instead of {SAFE.makespan}.
        </>
      ),
    },
    {
      id: "fever",
      title: "Manage the buffer, not the dates.",
      body: (
        <>
          Report CMS late: {firstCmsOverrun("yellow")} days over turns the point yellow, so plan a
          response; {firstCmsOverrun("red")} turns it red, so act. Nobody re-plans the dates.
        </>
      ),
    },
    {
      id: "try",
      title: "Try it: buffer sizing moves the commitment.",
      body: (
        <>
          Root-sum-square sizes the project buffer at {RSS.project.days} days instead of{" "}
          {HALF.project.days}, committing to day {COMMITTED.rss}. Pages has finished too, so push
          both overruns and watch the zone.
        </>
      ),
    },
  ],
  Scene: CriticalChainScene,
  Thumbnail: CriticalChainThumbnail,
  check: {
    question: "Where does a feeding buffer go?",
    options: [
      "At the end of the project",
      "Where a non-chain path joins the chain",
      "Before every task",
    ],
    answer: 1,
    why: "it protects the chain from late inputs.",
  },
};

export default function CriticalChainLesson() {
  return <LessonShell lesson={lesson} />;
}
