"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { DEADLINE, MIGRATION, WIDE_PESSIMISTIC } from "@/engine/pert/fixture";
import { expected, projectEstimate, variance, withEstimate } from "@/engine/pert/pert";
import { pct } from "@/lib/format";
import { commitDays } from "@/scenes/pert/format";
import { PertScene } from "@/scenes/pert/scene";
import { PertThumbnail } from "@/scenes/pert/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const write = MIGRATION.find((t) => t.id === "write")!;
const base = projectEstimate(MIGRATION);
const wide = projectEstimate(
  withEstimate(MIGRATION, write.id, { ...write.estimate, p: WIDE_PESSIMISTIC }),
);
const { o, m, p } = write.estimate;
const writeMean = expected(write.estimate);
/** Where the expected value lands relative to the most-likely: below, exactly, above. */
const leans = writeMean < m ? 0 : writeMean === m ? 1 : 2;
const modeChance = base.probabilityBy(base.modeSum);
/** What adding the task spreads would give, against the true project sigma. */
const spreadSum = MIGRATION.reduce((sum, t) => sum + Math.sqrt(variance(t.estimate)), 0);
const totalVariance = (tasks: typeof MIGRATION) =>
  tasks.reduce((sum, t) => sum + variance(t.estimate), 0);
const writeShare = variance(write.estimate) / totalVariance(MIGRATION);
const wideWrite = { ...write.estimate, p: WIDE_PESSIMISTIC };
const wideShare =
  variance(wideWrite) / totalVariance(withEstimate(MIGRATION, write.id, wideWrite));
const CHECK = { o: 2, m: 4, p: 12 };
const checkAnswer = expected(CHECK);
const checkOptions = [checkAnswer - 1, checkAnswer, checkAnswer + 1];

export const lesson: Lesson = {
  meta: lessonBySlug("pert"),
  beats: [
    {
      id: "ranges",
      title: "Three numbers beat one guess.",
      body: (
        <>
          Each task gets an <Term id="o">optimistic</Term>, a <Term id="m">most-likely</Term> and
          a <Term id="p">pessimistic</Term> estimate. The most-likely values add up to{" "}
          {base.modeSum} days, the number people usually promise.
        </>
      ),
      predict: {
        prompt: `${write.name} is ${o} / ${m} / ${p} days. Its expected duration will be…`,
        options: [`below ${m} days`, `exactly ${m} days`, `above ${m} days`],
        answer: leans,
        why: `Its tail is ${p - m} days right but ${m - o} left.`,
      },
    },
    {
      id: "expected",
      title: "The expected value leans toward the tail.",
      body: (
        <>
          PERT weights the most-likely value four times: (o + 4m + p) / 6.{" "}
          <Term id="tail">Long pessimistic tails</Term> pull every expectation right;{" "}
          {write.name} moves from {m} to <Term id="expected">{writeMean.toFixed(1)} days</Term>.
        </>
      ),
      predict: {
        prompt: `The most-likely values add to ${base.modeSum} days. What chance of finishing by then?`,
        options: [pct(0.8), pct(0.5), pct(modeChance)],
        answer: 2,
        why: "Every task's tail leans late, so the sum of peaks is optimistic.",
      },
      why: (
        <>
          The curve is how likely each duration is. With a longer right tail, unlucky days
          outweigh lucky ones, so the average sits right of the peak.
        </>
      ),
    },
    {
      id: "project",
      title: "Means and variances add along the chain.",
      body: (
        <>
          The project centres on {base.expected.toFixed(1)} days with{" "}
          <Term id="sigma">sigma</Term> {base.sigma.toFixed(1)}. The{" "}
          <Term id="deadline">{base.modeSum}-day promise</Term> has a{" "}
          <Term id="shade">{pct(modeChance)} chance</Term>.
        </>
      ),
      why: (
        <>
          Each task&apos;s spread is (p − o) / 6. Independent misses partly cancel, so variances
          add, not spreads: {spreadSum.toFixed(1)} days of summed spreads become{" "}
          {base.sigma.toFixed(1)}.
        </>
      ),
    },
    {
      id: "commit",
      title: "Commit at the confidence you can live with.",
      body: (
        <>
          Drag the deadline or pick a confidence level. An{" "}
          <Term id="shade">80% commitment</Term> needs {commitDays(base.daysFor(0.8))} days, not{" "}
          {base.modeSum}.
        </>
      ),
      why: (
        <>
          Confidence is the shaded share left of the deadline. Area grows quickly near the mean
          and slowly in the tail, so each extra 5% costs more days.
        </>
      ),
    },
    {
      id: "widen",
      title: "Try it: one wide tail dominates the spread.",
      body: (
        <>
          Raise {write.name}&apos;s <Term id="tail">pessimistic estimate</Term> to{" "}
          {WIDE_PESSIMISTIC} days: the mean moves to {wide.expected.toFixed(1)} and the chance of
          finishing by {DEADLINE} days drops from {pct(base.probabilityBy(DEADLINE))} to{" "}
          {pct(wide.probabilityBy(DEADLINE))}.
        </>
      ),
      predict: {
        prompt: `${write.name}'s pessimistic goes from ${p} to ${WIDE_PESSIMISTIC}. Its share of the project variance becomes…`,
        options: [`about the same, ${pct(writeShare)}`, pct(wideShare), "100%"],
        answer: 1,
        why: "Variance grows with the square of the range.",
      },
    },
  ],
  recap: [
    { step: "Estimate optimistic, most-likely and pessimistic days per task", beat: "ranges" },
    { step: "Expected = (o + 4m + p) / 6", beat: "expected" },
    { step: "Variance = ((p − o) / 6)²; add means and variances", beat: "project" },
    { step: "Read the chance as the shaded area left of a date", beat: "project" },
    { step: "Commit where the shaded share meets your confidence", beat: "commit" },
    { step: "Tighten the widest task first", beat: "widen" },
  ],
  Scene: PertScene,
  Thumbnail: PertThumbnail,
  check: {
    question: `A task is estimated ${CHECK.o} / ${CHECK.m} / ${CHECK.p} days. PERT expected duration?`,
    options: checkOptions.map((d) => `${d} days`),
    answer: 1,
    why: `The most-likely counts four times: (${CHECK.o} + ${4 * CHECK.m} + ${CHECK.p}) / 6 = ${checkAnswer} days.`,
  },
};

export default function PertLesson() {
  return <LessonShell lesson={lesson} />;
}
