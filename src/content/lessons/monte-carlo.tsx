"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { RUSH_CONFIRM, SPEAKERS } from "@/engine/monte-carlo/fixture";
import { pertTotal } from "@/engine/monte-carlo/simulate";
import { days, pct } from "@/lib/format";
import { DEFAULT_STREAMS, band, simFor } from "@/scenes/monte-carlo/model";
import { MonteCarloScene } from "@/scenes/monte-carlo/scene";
import { Thumbnail } from "@/scenes/monte-carlo/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const pert = pertTotal({ streams: DEFAULT_STREAMS });

function Distribution() {
  const { p50, p80 } = simFor(DEFAULT_STREAMS);
  return (
    <>
      Run batches until the histogram settles. Half the runs finish by P50, {days(p50)}, and four
      in five by P80, {days(p80)}.
    </>
  );
}

function MergeBias() {
  return (
    <>
      PERT still says {days(pert)} however many streams run side by side. Slide from one stream to
      six and P50 moves from {days(simFor(1).p50)} to {days(simFor(6).p50)}.
    </>
  );
}

function Criticality() {
  const even = simFor(DEFAULT_STREAMS).criticality;
  const rushed = simFor(DEFAULT_STREAMS, true).criticality[SPEAKERS];
  return (
    <>
      Each of the {even.length} streams sets the finish in {pct(even[SPEAKERS])} of runs.
      Rush the Speakers&apos; confirmation to {RUSH_CONFIRM.o}–{RUSH_CONFIRM.m}–{RUSH_CONFIRM.p} days
      and their share jumps to {pct(rushed)}.
    </>
  );
}

function Convergence() {
  const points = band();
  const few = points[0];
  const many = points[points.length - 1];
  return (
    <>
      The P80 estimate wobbles ±{days(few.sd, 2)} at {few.runs} runs but only ±{days(many.sd, 2)} at{" "}
      {many.runs.toLocaleString("en-US")}. Add runs until the band is narrow, then commit to the P80
      date.
    </>
  );
}

export const lesson: Lesson = {
  meta: lessonBySlug("monte-carlo"),
  beats: [
    {
      id: "roll",
      title: "One roll: every task draws from its curve.",
      body: "Press Roll. Each task draws a duration from its three-point estimate, the longest stream lights up, and its finish drops onto the axis.",
    },
    { id: "distribution", title: "Thousands of rolls become a distribution.", body: <Distribution /> },
    { id: "merge-bias", title: "Parallel paths push the finish past PERT.", body: <MergeBias /> },
    { id: "criticality", title: "Criticality: any stream can set the finish.", body: <Criticality /> },
    { id: "convergence", title: "Try it: more runs, a steadier P80.", body: <Convergence /> },
  ],
  Scene: MonteCarloScene,
  Thumbnail,
  check: {
    question: `PERT says ${days(pert)} for ${DEFAULT_STREAMS} equal parallel streams. The simulated median is…`,
    options: ["Earlier", "The same", "Later"],
    answer: 2,
    why: `The finish is the maximum of ${DEFAULT_STREAMS} uncertain paths.`,
  },
};

export default function MonteCarloLesson() {
  return <LessonShell lesson={lesson} />;
}
