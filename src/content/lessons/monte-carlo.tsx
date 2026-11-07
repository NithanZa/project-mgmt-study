"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { MAX_STREAMS, RUSH_CONFIRM, SPEAKERS } from "@/engine/monte-carlo/fixture";
import { pertTotal } from "@/engine/monte-carlo/simulate";
import { days, pct } from "@/lib/format";
import { DEFAULT_STREAMS, band, simFor } from "@/scenes/monte-carlo/model";
import { MonteCarloScene } from "@/scenes/monte-carlo/scene";
import { Thumbnail } from "@/scenes/monte-carlo/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const pert = pertTotal({ streams: DEFAULT_STREAMS });
const nearest = (values: number[], target: number) =>
  values.reduce((best, v, i) => (Math.abs(v - target) < Math.abs(values[best] - target) ? i : best), 0);

// Predicts are plain data, so their answers are computed once at module load.
const byPert = (() => {
  const { durations } = simFor(DEFAULT_STREAMS);
  let n = 0;
  for (const d of durations) if (d <= pert) n++;
  return n / durations.length;
})();
const byPertOptions = [0.8, 0.5, byPert];

/** P50 gained by the second stream versus by the last one. */
const firstStep = simFor(2).p50 - simFor(1).p50;
const lastStep = simFor(MAX_STREAMS).p50 - simFor(MAX_STREAMS - 1).p50;
/** Steps within a twentieth of a day count as the same. */
const SAME = 0.05;
const stepAnswer = Math.abs(firstStep - lastStep) < SAME ? 0 : lastStep < firstStep ? 1 : 2;

const rushedShare = simFor(DEFAULT_STREAMS, true).criticality[SPEAKERS];
const rushOptions = [1 / DEFAULT_STREAMS, rushedShare, 1];

function Distribution() {
  const { p50, p80 } = simFor(DEFAULT_STREAMS);
  return (
    <>
      Run batches until the <Term id="bins">histogram</Term> settles. Half the runs finish by{" "}
      <Term id="p50">P50</Term>, {days(p50)}, and four in five by <Term id="p80">P80</Term>,{" "}
      {days(p80)}; PERT&apos;s date is the <Term id="pert">dashed line</Term>.
    </>
  );
}

function MergeBias() {
  return (
    <>
      <Term id="pert">PERT</Term> still says {days(pert)} however many streams run side by side.
      Slide from <Term id="streams">one stream to six</Term> and <Term id="p50">P50</Term> moves
      from {days(simFor(1).p50)} to {days(simFor(MAX_STREAMS).p50)}.
    </>
  );
}

function Criticality() {
  const even = simFor(DEFAULT_STREAMS).criticality;
  return (
    <>
      Each of the {even.length} streams <Term id="share">sets the finish</Term> in{" "}
      {pct(even[SPEAKERS])} of runs. Rush the <Term id="speakers">Speakers</Term>&apos;
      confirmation to {RUSH_CONFIRM.o}–{RUSH_CONFIRM.m}–{RUSH_CONFIRM.p} days and watch the bars.
    </>
  );
}

function Convergence() {
  const points = band();
  const few = points[0];
  const many = points[points.length - 1];
  return (
    <>
      The <Term id="estimate">P80 estimate</Term> <Term id="band">wobbles ±</Term>
      {days(few.sd, 2)} at {few.runs} <Term id="runs">runs</Term> but only ±{days(many.sd, 2)} at{" "}
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
      body: (
        <>
          Press Roll. Each task draws a duration from its{" "}
          <Term id="estimate">three-point estimate</Term>, the{" "}
          <Term id="longest">longest stream</Term> lights up, and its finish drops onto{" "}
          <Term id="roll">the axis</Term>.
        </>
      ),
      why: "Prep can't start until every stream is done, so each roll's finish is the slowest stream plus Prep.",
    },
    {
      id: "distribution",
      title: "Thousands of rolls become a distribution.",
      body: <Distribution />,
      predict: {
        prompt: "What share of runs will finish by the dashed PERT date?",
        options: byPertOptions.map((v) => `about ${pct(v)}`),
        answer: nearest(byPertOptions, byPert),
        why: "PERT averages each stream but ignores that the slowest one wins.",
      },
      why: "Each column counts runs ending in that half-day. P80 leaves one run in five later than your date, a margin most teams can defend.",
    },
    {
      id: "merge-bias",
      title: "Parallel paths push the finish past PERT.",
      body: <MergeBias />,
      predict: {
        prompt: "Every added stream is identical. Each one pushes P50 later by…",
        options: ["the same amount", "less each time", "more each time"],
        answer: stepAnswer,
        why: "Each new stream must beat the current slowest to matter.",
      },
      why: "PERT adds the longest expected stream to Prep. Each extra stream is another chance for one to run late, and an early stream can't make up for it.",
    },
    {
      id: "criticality",
      title: "Criticality: any stream can set the finish.",
      body: <Criticality />,
      predict: {
        prompt: "Rush the Speakers' confirmation. Their share of runs becomes…",
        options: rushOptions.map((v) => pct(v)),
        answer: nearest(rushOptions, rushedShare),
        why: "Other streams still run late sometimes.",
      },
      why: "CPM names one critical path; under uncertainty every stream is critical part of the time. Watch every stream with a large share.",
    },
    { id: "convergence", title: "Try it: more runs, a steadier P80.", body: <Convergence /> },
  ],
  recap: [
    { step: "Give every task an optimistic, likely and pessimistic duration", beat: "roll" },
    { step: "Draw one duration per task; the finish is the slowest path", beat: "roll" },
    { step: "Repeat thousands of times and plot the finishes", beat: "distribution" },
    { step: "Read P50 and P80 off the histogram", beat: "distribution" },
    { step: "Check which paths set the finish, and how often", beat: "criticality" },
    { step: "Add runs until P80 holds still, then commit", beat: "convergence" },
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
