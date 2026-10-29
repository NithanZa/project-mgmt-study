"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { schedule } from "@/engine/crashing/cpm";
import { crashCurve, optimum } from "@/engine/crashing/crash";
import { BOOTH, DEFAULT_OVERHEAD, OVERHEAD_RANGE } from "@/engine/crashing/fixture";
import { days, money } from "@/lib/format";
import { CrashingScene } from "@/scenes/crashing/scene";
import { CrashingThumbnail } from "@/scenes/crashing/thumbnail";
import type { Lesson } from "../types";
import { lessonBySlug } from "../meta";

const CHEAP_OVERHEAD = 500;

const curve = crashCurve(BOOTH);
const name = (id: string) => BOOTH.find((t) => t.id === id)!.name;
const names = (ids: string[]) => ids.map(name).join(" plus ");
const [, first, second] = curve;
const pair = curve.find((p) => p.step && p.step.crashed.length > 1)!.step!;
const best = optimum(curve, DEFAULT_OVERHEAD);
const afterBest = curve[curve.findIndex((p) => p.days === best.days) + 1].step!;
const graphics = BOOTH.find((t) => t.id === "C")!;

export const lesson: Lesson = {
  meta: lessonBySlug("crashing"),
  beats: [
    {
      id: "prices",
      title: "Every task has a price for going faster.",
      body: (
        <>
          Each badge shows what one day less costs and the shortest the task can go. The lit critical
          path sets the finish at {days(schedule(BOOTH).duration)}.
        </>
      ),
    },
    {
      id: "cheapest",
      title: "Buy the cheapest critical day.",
      body: (
        <>
          {names(first.step!.crashed)} is the cheapest critical task: {money(first.step!.cost)} buys
          one day, finishing in {days(first.days)}. The chart plots that first point.
        </>
      ),
    },
    {
      id: "two-paths",
      title: "Two critical paths: crash the shared task.",
      body: (
        <>
          Both paths are now critical, so a day off one alone saves nothing. {names(second.step!.crashed)}{" "}
          sits on both: {money(second.step!.cost)} beats {names(pair.crashed)} at {money(pair.cost)}.
        </>
      ),
    },
    {
      id: "stop",
      title: "Stop when crashing costs more than it saves.",
      body: (
        <>
          Each day the booth runs costs {money(DEFAULT_OVERHEAD)} in overhead. The total is lowest at{" "}
          {days(best.days)}: the next day costs {money(afterBest.cost)}, more than it saves.
        </>
      ),
    },
    {
      id: "try",
      title: "Try it: crash, undo, move the overhead.",
      body: (
        <>
          At {money(CHEAP_OVERHEAD)} a day the cheapest stop is{" "}
          {days(optimum(curve, CHEAP_OVERHEAD).days)}; at {money(OVERHEAD_RANGE.max)} it pays to go
          all the way to {days(optimum(curve, OVERHEAD_RANGE.max).days)}. Crashing {graphics.name}{" "}
          spends {money(graphics.costPerDay)} and saves no days.
        </>
      ),
    },
  ],
  Scene: CrashingScene,
  Thumbnail: CrashingThumbnail,
  check: {
    question: `Overhead is ${money(DEFAULT_OVERHEAD)} per day and the next crash step costs ${money(pair.cost)}. Take it?`,
    options: ["Yes", "No"],
    answer: 1,
    why: `The step costs ${money(pair.cost - DEFAULT_OVERHEAD)} more than the ${money(DEFAULT_OVERHEAD)} of overhead it saves.`,
  },
};

export default function CrashingLesson() {
  return <LessonShell lesson={lesson} />;
}
