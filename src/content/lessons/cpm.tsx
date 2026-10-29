"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { computeCriticalPath, withWeeks } from "@/engine/critical-path/cpm";
import { COFFEE_SHOP, PRESETS } from "@/engine/critical-path/fixture";
import { CriticalPathScene } from "@/scenes/critical-path/scene";
import { Thumbnail } from "@/scenes/critical-path/thumbnail";
import type { Lesson } from "../types";
import { lessonBySlug } from "../meta";

const base = computeCriticalPath(COFFEE_SHOP);
const task = (id: string) => COFFEE_SHOP.find((t) => t.id === id)!;
const floats = COFFEE_SHOP.filter((t) => base.rows[t.id].float > 0);

const reno = task("C");
const renoFloat = base.rows.C.float;
const renoLate = reno.weeks + renoFloat + 1;
const renoLateResult = computeCriticalPath(withWeeks(COFFEE_SHOP, "C", renoLate));
const slip = computeCriticalPath(withWeeks(COFFEE_SHOP, "C", reno.weeks + renoFloat)).duration - base.duration;
const checkOptions = [0, 1, 2];
const permits = PRESETS.find((p) => p.task === "B")!;
const permitsResult = computeCriticalPath(withWeeks(COFFEE_SHOP, "B", permits.weeks));

const list = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0];

export const lesson: Lesson = {
  meta: lessonBySlug("cpm"),
  beats: [
    {
      id: "network",
      title: "Arrows show which task waits for which.",
      body: "Each arrow means a task cannot start until the one behind it ends. Hover or focus a task to see what it waits for.",
    },
    {
      id: "forward",
      title: "Walk forward for the earliest start.",
      body: (
        <>
          Each task starts (ES, above left) when its last predecessor finishes (EF, above right).
          The last finish is week {base.duration}: the earliest opening.
        </>
      ),
    },
    {
      id: "backward",
      title: "Walk backward for the latest start.",
      body: (
        <>
          From week {base.duration}, each task gets the latest start (LS) and finish (LF) that keeps
          the opening. The gap is float: {list(floats.map((t) => `${t.id} ${base.rows[t.id].float}`))}{" "}
          weeks.
        </>
      ),
    },
    {
      id: "critical",
      title: "Zero float is the critical path.",
      body: (
        <>
          {base.criticalPaths[0].join(" ")} has no float, so any delay there moves the opening past
          week {base.duration}. The strip below shows float as dashed ghosts.
        </>
      ),
    },
    {
      id: "sandbox",
      title: "Try it: delays beyond float move the opening.",
      body: (
        <>
          {reno.name} can grow to {reno.weeks + renoFloat} weeks for free; at {renoLate} the opening
          moves to week {renoLateResult.duration}. Set Permits to {permits.weeks} weeks and{" "}
          {permitsResult.criticalPaths.length} paths become critical.
        </>
      ),
    },
  ],
  Scene: CriticalPathScene,
  Thumbnail,
  check: {
    question: `${reno.name} slips by ${renoFloat} weeks. The opening moves by…`,
    options: checkOptions.map((n) => `${n} ${n === 1 ? "week" : "weeks"}`),
    answer: checkOptions.indexOf(slip),
    why: `${reno.name}'s ${renoFloat} weeks of float absorb the slip.`,
  },
};

export default function CpmLesson() {
  return <LessonShell lesson={lesson} />;
}
