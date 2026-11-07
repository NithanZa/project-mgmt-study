"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { cpm } from "@/engine/rcpsp/cpm";
import { CAPACITIES, GAME_JAM } from "@/engine/rcpsp/fixture";
import { exhaustive } from "@/engine/rcpsp/search";
import { makespan, ruleComparator, serialSgs, usage } from "@/engine/rcpsp/sgs";
import { RULES, type Rule } from "@/engine/rcpsp/types";
import { RULE_LABEL } from "@/scenes/rcpsp/rules";
import { RcpspScene } from "@/scenes/rcpsp/scene";
import { RcpspThumbnail } from "@/scenes/rcpsp/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const base = cpm(GAME_JAM);
const programmers = usage(GAME_JAM, base.schedule, base.duration).programmer;
const peak = Math.max(...programmers);
const ruleSchedule = (rule: Rule) => serialSgs(GAME_JAM, CAPACITIES, ruleComparator(rule, GAME_JAM));
const ruleDays = RULES.map((rule) => makespan(ruleSchedule(rule)));
const daysOf = (rule: Rule) => ruleDays[RULES.indexOf(rule)];
const shortestDays = Math.min(...ruleDays);
const longestDays = Math.max(...ruleDays);
const labels = (rules: Rule[]) => rules.map((r) => RULE_LABEL[r]).join(" and ");
const lstTies = RULES.filter((r) => r !== "min-lst" && daysOf(r) === daysOf("min-lst"));
const worstRules = RULES.filter((r) => daysOf(r) === longestDays);
const PREDICT_RULES: Rule[] = ["min-lst", "longest", "shortest"];
const soonest = PREDICT_RULES.reduce((best, r, i) => (daysOf(r) < daysOf(PREDICT_RULES[best]) ? i : best), 0);

const task = (id: string) => GAME_JAM.findIndex((t) => t.id === id);
const lstSchedule = ruleSchedule("min-lst");
const level1 = GAME_JAM[task("D")];
const engine = GAME_JAM[task("B")];
const engineStart = lstSchedule[task("B")].start;

const search = exhaustive(GAME_JAM, CAPACITIES);
const best = search.best.makespan;
const bestCount = search.histogram[best];
const mode = Number(Object.entries(search.histogram).reduce((a, b) => (b[1] > a[1] ? b : a))[0]);
const bestShare = bestCount / search.evaluated;
const bestAnswer = bestShare > 0.5 ? 0 : bestCount === 1 ? 2 : 1;

const thirdProgrammer = exhaustive(GAME_JAM, { ...CAPACITIES, programmer: CAPACITIES.programmer + 1 }).best.makespan;
const secondArtist = exhaustive(GAME_JAM, { ...CAPACITIES, artist: CAPACITIES.artist + 1 }).best.makespan;
const hireAnswer = thirdProgrammer < secondArtist ? 0 : secondArtist < thirdProgrammer ? 1 : 2;
const hireWhy =
  hireAnswer === 2
    ? `Either hire gives ${thirdProgrammer} days.`
    : hireAnswer === 0
      ? `Best drops to ${thirdProgrammer}; a second artist leaves it at ${secondArtist}.`
      : `Best drops to ${secondArtist}; a third programmer leaves it at ${thirdProgrammer}.`;

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
          Start every task as soon as its <Term id="deps">dependencies</Term> finish and the jam
          ends on day {base.duration}. The <Term id="overload">hatched block</Term> is the catch: on
          day {programmers.indexOf(peak)} it needs {peak} <Term id="programmer">programmers</Term> and{" "}
          <Term id="capacity">the team has {CAPACITIES.programmer}</Term>; the artist is
          double-booked too.
        </>
      ),
    },
    {
      id: "rule",
      title: `A sensible rule gives ${daysOf("min-lst")} days.`,
      body: (
        <>
          Book tasks one at a time, <Term id="rank">latest start first (Min LST)</Term>, each on the
          first day its people are free. Press Place next task and watch each bar land.
        </>
      ),
      why: (
        <>
          A task&apos;s latest start is the last day it can begin and still finish by day{" "}
          {base.duration}. The smallest has the least room to wait, so it gets people first.
        </>
      ),
    },
    {
      id: "rules",
      title: "Different rules, different answers.",
      body: (
        <>
          Each <Term id="rule-dots">priority rule</Term> is a quick guess at which task deserves
          people first. These {RULES.length} land anywhere from {shortestDays} to {longestDays} days,
          and none promises the best.
        </>
      ),
      why: (
        <>
          A rule ranks tasks before seeing how they collide. Latest start books {level1.name} before{" "}
          {engine.name}, which needs both programmers, so it waits until day {engineStart}.
        </>
      ),
      predict: {
        prompt: "Which rule finishes soonest here?",
        options: ["Latest start", "Longest", "Shortest"],
        answer: soonest,
        why: `${daysOf("min-lst")} days, tied with ${labels(lstTies)}; ${labels(worstRules)} are worst at ${longestDays}.`,
      },
    },
    {
      id: "search",
      title: `The exact answer needs search: ${best} days.`,
      body: (
        <>
          Every order of the {GAME_JAM.length} tasks gives a schedule, {search.evaluated} in all.
          Trying each one finds <Term id="best">{best} days</Term>, still above the{" "}
          <Term id="lower-bound">{base.duration}-day lower bound</Term> that ignores people.
        </>
      ),
      why: (
        <>
          Adding a constraint can never shorten a plan, so the people-free {base.duration} days is a
          floor. The gap to {best} is the cost of the team size.
        </>
      ),
      predict: {
        prompt: `Of all ${search.evaluated} orders, how many reach the best schedule?`,
        options: ["Most", "About one in eight", "Only one"],
        answer: bestAnswer,
        why: `${bestCount} orders tie at ${best} days; most land at ${mode}.`,
      },
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
      why: (
        <>
          Branch-and-bound builds orders task by task and drops any partial order whose bound cannot
          beat the best found, so most of the {bigOrders.toLocaleString("en-US")} orders are never
          tried.
        </>
      ),
      predict: {
        prompt: "One extra hire: which shortens the best plan more?",
        options: ["A third programmer", "A second artist", "Both the same"],
        answer: hireAnswer,
        why: hireWhy,
      },
    },
  ],
  recap: [
    { step: "Run CPM ignoring people; its length is the lower bound", beat: "cpm" },
    { step: "Compare each role's daily demand with headcount", beat: "cpm" },
    { step: "Pick a rule; place each task on its first free day", beat: "rule" },
    { step: "Try several rules and keep the shortest", beat: "rules" },
    { step: "Search exactly when small; use a solver when large", beat: "search" },
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
