"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { earlySchedule } from "@/engine/resource-leveling/cpm";
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
const leveled = makespan(level(FEATURES, CAP, "min-lst"));
const shortest = makespan(level(FEATURES, CAP, "shortest"));
const twoDesigners = makespan(level(FEATURES, { ...CAP, designer: 2 }, "min-lst"));
const oneDeveloper = makespan(level(FEATURES, { ...CAP, developer: 1 }, "min-lst"));

export const lesson: Lesson = {
  meta: lessonBySlug("resource-leveling"),
  beats: [
    {
      id: "overbooked",
      title: `The ${earlyEnd}-day plan overbooks the designer.`,
      body: `Every task starts as early as its dependencies allow. Hatched blocks show the overload: ${peak("designer")} designers needed on ${overDays("designer")} with only ${CAP.designer} on staff, and ${peak("developer")} developers on ${overDays("developer")}.`,
    },
    {
      id: "float",
      title: "Spend float first.",
      body: `Z1 slides into its float and starts on day ${within.schedule.Z1.start}. Y1 runs out of float before the designer is free, so ${withinOver} overloaded days remain.`,
    },
    {
      id: "level",
      title: "When float runs out, the end date moves.",
      body: `Leveling now delays work past its float, giving the designer to the most urgent task first. Both lanes fit, and the plan ends on day ${leveled}, ${days(leveled - earlyEnd, 0)} later.`,
    },
    {
      id: "rule",
      title: "The order you pick matters.",
      body: `So far the task that must start soonest went first (Min LST). Shortest-first lets small tasks hog the designer while the long feature waits, and the plan ends on day ${shortest}.`,
    },
    {
      id: "try",
      title: `Try it: a second designer saves ${days(leveled - twoDesigners, 0)}.`,
      body: `Drag a bar, or focus it and use the arrow keys; later work is pushed and the lanes update. A second designer brings the end back to day ${twoDesigners}; a single developer pushes it to day ${oneDeveloper}.`,
    },
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
