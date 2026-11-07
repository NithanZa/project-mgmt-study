"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { fever } from "@/engine/critical-chain/fever";
import type { Zone } from "@/engine/critical-chain/types";
import { days, pct } from "@/lib/format";
import { CriticalChainScene } from "@/scenes/critical-chain/scene";
import { CriticalChainThumbnail } from "@/scenes/critical-chain/thumbnail";
import {
  CHAINS,
  CHAIN_SAFETIES,
  CHAIN_SAFETY,
  COMMITTED,
  FEASIBLE_FLOAT,
  HALF,
  PLAN,
  RSS,
  SAFE,
  TASKS,
  UNCONSTRAINED,
  bufferUsedAt,
  firstCmsOverrun,
  nameOf,
  names,
} from "@/scenes/critical-chain/model";
import type { Lesson } from "../types";
import { lessonBySlug } from "../meta";

const feeding = HALF.feeding[0];
const [floating, floatDays] = Object.entries(FEASIBLE_FLOAT)[0];

/** Fever predict: CMS reported just late enough to leave the OK zone. */
const watchOverrun = firstCmsOverrun("yellow");
const watchStatus = fever(TASKS, { cms: watchOverrun });
const ZONES: Zone[] = ["green", "yellow", "red"];

/** Feeding predict: Design late by exactly its feeding buffer. */
const feedingUsedDays = Math.round(bufferUsedAt(feeding.days) * HALF.project.days);

/** Try predict: the chain task whose cut weighs most under root-sum-square. */
const biggestCut = CHAINS.buffered.ids[CHAIN_SAFETIES.indexOf(Math.max(...CHAIN_SAFETIES))];
const rssCompare = RSS.project.days - HALF.project.days;
const squares = CHAIN_SAFETIES.filter((s) => s > 0)
  .map((s) => `${s}²`)
  .join(" + ");

export const lesson: Lesson = {
  meta: lessonBySlug("critical-chain"),
  beats: [
    {
      id: "padding",
      title: "Everyone pads, and the padding gets used anyway.",
      body: (
        <>
          Each <Term id="padded">pale bar</Term> is a padded estimate around a dark{" "}
          <Term id="core">50% core</Term>. The <Term id="chain">critical path</Term> says{" "}
          {UNCONSTRAINED.makespan} days, yet Pages and CMS need{" "}
          <Term id="clash">the one developer</Term> at the same time.
        </>
      ),
      why: (
        <>
          A 50% estimate is one you&apos;d beat half the time. Padding rarely comes back: work
          expands to fill the estimate and early finishes go unreported.
        </>
      ),
    },
    {
      id: "chain",
      title: "The chain follows people, not only arrows.",
      body: (
        <>
          With CMS before Pages the developer finishes in {SAFE.makespan} days. The{" "}
          <Term id="chain">critical chain</Term> runs {names(CHAINS.feasible.ids)} through the{" "}
          <Term id="resource-link">dashed resource link</Term>, and {nameOf(floating)} gets{" "}
          <Term id="float">{floatDays} days of float</Term>.
        </>
      ),
      why: (
        <>
          Pages waits for the developer to finish CMS on day {SAFE.finish.cms}, not for Design on
          day {SAFE.finish.design}. That hand-off is a link, so the longest path runs through it.
        </>
      ),
    },
    {
      id: "buffers",
      title: "Cut the padding, pool the safety.",
      body: (
        <>
          Plan on the 50% cores and pool the removed safety: a{" "}
          <Term id="project-buffer">{HALF.project.days}-day project buffer</Term> at the end, a{" "}
          <Term id="feeding-buffer">{feeding.days}-day feeding buffer</Term> where{" "}
          {nameOf(feeding.from)} feeds {nameOf(feeding.before)}. We{" "}
          <Term id="commit">commit to day {COMMITTED.half}</Term>, not {SAFE.makespan}.
        </>
      ),
      why: (
        <>
          Tasks rarely all overrun, so one shared buffer covers the chain&apos;s total slip with less
          than the {CHAIN_SAFETY} days it replaces.
        </>
      ),
    },
    {
      id: "fever",
      title: "Manage the buffer, not the dates.",
      body: (
        <>
          Report CMS late; the point plots buffer used against chain done.{" "}
          <Term id="zone-watch">Watch</Term> means plan a response, <Term id="zone-act">Act</Term>{" "}
          means take it. Nobody re-plans the dates.
        </>
      ),
      why: (
        <>
          Early on, little buffer should be gone; near the end nearly all of it may be. So the
          Watch and Act lines rise as the chain completes.
        </>
      ),
      predict: {
        prompt: `CMS finishes ${days(watchOverrun)} late. Which zone?`,
        options: ["OK", "Watch", "Act"],
        answer: ZONES.indexOf(watchStatus.zone),
        why: `${pct(watchStatus.bufferUsed)} of the buffer is gone with only ${pct(watchStatus.chainComplete)} of the chain done.`,
      },
    },
    {
      id: "feeding",
      title: "A feeding buffer guards where side paths join.",
      body: (
        <>
          Now {nameOf(feeding.before)} has finished too. Make {nameOf(feeding.from)} late: the hatch
          shows its delay landing in the <Term id="feeding-buffer">feeding buffer</Term> first; the
          fever point shows any that reaches the <Term id="project-buffer">project buffer</Term>.
        </>
      ),
      predict: {
        prompt: `${nameOf(feeding.from)} finishes ${days(feeding.days)} late. How much project buffer does it use?`,
        options: ["None", "1 day", "2 days"],
        answer: Math.min(feedingUsedDays, 2),
        why: `The ${feeding.days}-day feeding buffer sits before ${nameOf(feeding.before)}, which still starts on day ${PLAN.start[feeding.before]}; one more day uses ${pct(bufferUsedAt(feeding.days + 1))}.`,
      },
    },
    {
      id: "try",
      title: "Try it: buffer sizing moves the commitment.",
      body: (
        <>
          Switch Project buffer sizing to Root-sum-square, then push both overruns and watch the
          zone.
        </>
      ),
      why: (
        <>
          Root-sum-square, √({squares}) rounded up, assumes overruns are independent: one big cut
          counts heavily, small cuts barely add.
        </>
      ),
      predict: {
        prompt: "Will Root-sum-square give a bigger or smaller buffer than Half here?",
        options: ["Smaller", "Bigger", "Same"],
        answer: rssCompare < 0 ? 0 : rssCompare > 0 ? 1 : 2,
        why: `${RSS.project.days} vs ${HALF.project.days} days: ${nameOf(biggestCut)}' cut dominates.`,
      },
    },
  ],
  recap: [
    { step: "Get a padded and a 50% estimate for each task", beat: "padding" },
    { step: "Resolve clashes; the longest path through both link types is the chain", beat: "chain" },
    { step: "Plan on the cores; pool the cut safety into a project buffer", beat: "buffers" },
    { step: "Put a feeding buffer where a side path joins the chain", beat: "feeding" },
    { step: "Track buffer used against chain done; act in the Act zone", beat: "fever" },
    { step: "Size the buffer by half or root-sum-square, then commit", beat: "try" },
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
