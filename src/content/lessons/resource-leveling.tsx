"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { cpm, earlySchedule } from "@/engine/resource-leveling/cpm";
import { DEFAULT_CAPACITIES, FEATURES } from "@/engine/resource-leveling/fixture";
import { level, levelWithinFloat, makespan } from "@/engine/resource-leveling/level";
import { demand, overloadedDays, overloads } from "@/engine/resource-leveling/profile";
import type { Resource } from "@/engine/resource-leveling/types";
import { days } from "@/lib/format";
import { ResourceLevelingScene } from "@/scenes/resource-leveling/scene";
import { ResourceLevelingThumbnail } from "@/scenes/resource-leveling/thumbnail";
import type { Lesson } from "../types";
import { lessonBySlug } from "../meta";

const CAP = DEFAULT_CAPACITIES;
const ROWS = cpm(FEATURES).rows;
const early = earlySchedule(FEATURES);
const earlyEnd = makespan(early);
const earlyLoad = demand(FEATURES, early);
const earlyOver = overloads(earlyLoad, CAP);
const peak = (r: Resource) => Math.max(...earlyLoad[r]);
const overDays = (r: Resource) => {
  const ds = earlyOver.filter((o) => o.resource === r).map((o) => o.day);
  return ds.length > 1 ? `days ${ds.slice(0, -1).join(", ")} and ${ds.at(-1)}` : `day ${ds[0]}`;
};

const within = levelWithinFloat(FEATURES, CAP);
const withinOver = overloadedDays(overloads(demand(FEATURES, within.schedule), CAP));
const leveledPlan = level(FEATURES, CAP, "min-lst").schedule;
const leveled = makespan(leveledPlan);
const shortestPlan = level(FEATURES, CAP, "shortest").schedule;
const shortest = makespan(shortestPlan);
const twoDesigners = makespan(level(FEATURES, { ...CAP, designer: 2 }, "min-lst").schedule);
const oneDeveloper = makespan(level(FEATURES, { ...CAP, developer: 1 }, "min-lst").schedule);

export const lesson: Lesson = {
  meta: lessonBySlug("resource-leveling"),
  beats: [
    {
      id: "overbooked",
      title: `The ${earlyEnd}-day plan overbooks the designer.`,
      body: (
        <>
          Every task starts as early as its dependencies allow. Each <Term id="person-day">lane block</Term> is
          one person-day; blocks above the <Term id="capacity">headcount line</Term> are{" "}
          <Term id="overload">hatched</Term>: {peak("designer")} designers on {overDays("designer")},{" "}
          {peak("developer")} developers on {overDays("developer")}.
        </>
      ),
    },
    {
      id: "float",
      title: "Spend float first.",
      body: (
        <>
          Each dashed window is a task&apos;s <Term id="float">float</Term>: the days it can slip without
          moving the end. Turn on Level within float: Z1 slides into its float and starts on day{" "}
          {within.schedule.Z1.start}.
        </>
      ),
      predict: {
        prompt: "Can sliding tasks inside their float clear every overload?",
        options: ["Yes", "No"],
        answer: withinOver === 0 ? 0 : 1,
        why: `Y1 can wait only ${ROWS.Y1.float} days, but the designer is on X1 until day ${early.X1.end}.`,
      },
      why: <>Leveling slides the task with the most float first, because it can move furthest without touching the end.</>,
    },
    {
      id: "level",
      title: "When float runs out, the end date moves.",
      body: (
        <>
          Leveling now delays work past its float, giving the designer to the{" "}
          <Term id="order">most urgent task first</Term>. Both lanes fit, and the plan{" "}
          <Term id="end">ends on day {leveled}</Term>, {days(leveled - earlyEnd, 0)} later.
        </>
      ),
      why: (
        <>
          Starting a task after its latest start pushes the end by the same amount. Y1&apos;s latest start
          is day {ROWS.Y1.ls}; the designer is free on day {leveledPlan.Y1.start}.
        </>
      ),
    },
    {
      id: "rule",
      title: "The rule picks who books next.",
      body: (
        <>
          So far <Term id="lst">latest start first (Min LST)</Term> chose which ready task books next; the
          badges show the sequence. Switch the rule to Shortest and compare the end day.
        </>
      ),
      predict: {
        prompt: `Shortest-first books small tasks first. Will the plan end sooner or later than day ${leveled}?`,
        options: ["Sooner", "Same day", "Later"],
        answer: shortest > leveled ? 2 : shortest === leveled ? 1 : 0,
        why: `Day ${shortest}: Design X waits until day ${shortestPlan.X1.start}, and X has no float.`,
      },
      why: (
        <>
          LST is the latest start: the last day a task can begin without moving the end. Booking the
          smallest LST first protects the tasks with the least room.
        </>
      ),
    },
    {
      id: "try",
      title: "Try it: buy back time with people.",
      body: (
        <>
          Drag a bar, or focus it and use the arrow keys; later work is pushed. Change headcounts and compare
          the end day.
        </>
      ),
      predict: {
        prompt: `Add a second designer: does the end return to day ${earlyEnd}, the plan that ignores people?`,
        options: ["Yes", "No"],
        answer: twoDesigners === earlyEnd ? 0 : 1,
        why: `${days(twoDesigners, 0)}: every task fits inside its float. One developer instead pushes it to ${oneDeveloper}.`,
      },
    },
  ],
  recap: [
    { step: "Schedule every task early; plot each role's load against headcount", beat: "overbooked" },
    { step: "Slide the tasks with the most float first", beat: "float" },
    { step: "Still overloaded? Book tasks one by one on the earliest free day", beat: "level" },
    { step: "Use latest start first as the booking rule", beat: "rule" },
    { step: "Compare adding people with accepting the later end", beat: "try" },
  ],
  Scene: ResourceLevelingScene,
  Thumbnail: ResourceLevelingThumbnail,
  check: {
    question: "Which of these can leveling change?",
    options: ["Task durations", "Task start dates and order", "Dependencies"],
    answer: 1,
    why: "leveling only moves work in time.",
  },
};

export default function ResourceLevelingLesson() {
  return <LessonShell lesson={lesson} />;
}
