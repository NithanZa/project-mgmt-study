"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { cpm } from "@/engine/rcpsp/cpm";
import { CAPACITIES, GAME_JAM } from "@/engine/rcpsp/fixture";
import { exhaustive } from "@/engine/rcpsp/search";
import { makespan, ruleComparator, serialSgs, usage } from "@/engine/rcpsp/sgs";
import { RULES } from "@/engine/rcpsp/types";
import { RcpspScene } from "@/scenes/rcpsp/scene";
import { RcpspThumbnail } from "@/scenes/rcpsp/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const base = cpm(GAME_JAM);
const programmers = usage(GAME_JAM, base.schedule, base.duration).programmer;
const peak = Math.max(...programmers);
const ruleDays = RULES.map((rule) =>
  makespan(serialSgs(GAME_JAM, CAPACITIES, ruleComparator(rule, GAME_JAM))),
);
const search = exhaustive(GAME_JAM, CAPACITIES);
const BIG = 12;
const bigOrders = Array.from({ length: BIG }, (_, i) => i + 1).reduce((a, b) => a * b, 1);

export const lesson: Lesson = {
  meta: lessonBySlug("rcpsp"),
  beats: [
    {
      id: "cpm",
      title: `Ignore people and it is ${base.duration} days.`,
      body: (
        <>
          Start every task as soon as its dependencies finish and the jam ends on day{" "}
          {base.duration}. The hatched block is the catch: on day {programmers.indexOf(peak)} it
          needs {peak} programmers and the team has {CAPACITIES.programmer}.
        </>
      ),
    },
    {
      id: "rule",
      title: `A sensible rule gives ${ruleDays[0]} days.`,
      body: (
        <>
          Place tasks one at a time, the one with the earliest latest start first, each on the first
          day its people are free. Nothing overflows, and the jam takes {ruleDays[0]} days.
        </>
      ),
    },
    {
      id: "rules",
      title: "Different rules, different answers.",
      body: (
        <>
          Each priority rule is a quick guess at which task deserves people first. These six land
          anywhere from {Math.min(...ruleDays)} to {Math.max(...ruleDays)} days, and none promises
          the best.
        </>
      ),
    },
    {
      id: "search",
      title: `The exact answer needs search: ${search.best.makespan} days.`,
      body: (
        <>
          Every order of the {GAME_JAM.length} tasks gives a schedule, {search.evaluated} in all.
          Trying each one finds {search.best.makespan} days, still above the {base.duration}-day
          lower bound that ignores people.
        </>
      ),
    },
    {
      id: "try",
      title: "Try it: exact search does not scale.",
      body: (
        <>
          Changing the team re-runs every rule and the search. Orders grow factorially,{" "}
          {bigOrders.toLocaleString("en-US")} for {BIG} tasks, so real projects use branch-and-bound
          or constraint solvers.
        </>
      ),
    },
  ],
  Scene: RcpspScene,
  Thumbnail: RcpspThumbnail,
  check: {
    question: "Under resource limits the CPM duration is…",
    options: ["the exact answer", "a lower bound", "an upper bound"],
    answer: 1,
    why: "adding constraints can only lengthen a schedule.",
  },
};

export default function RcpspLesson() {
  return <LessonShell lesson={lesson} />;
}
