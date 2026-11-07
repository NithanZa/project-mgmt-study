"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
import { schedule } from "@/engine/crashing/cpm";
import { crashCurve, optimum, shorten } from "@/engine/crashing/crash";
import { BOOTH, DEFAULT_OVERHEAD, OVERHEAD_RANGE } from "@/engine/crashing/fixture";
import { days, money } from "@/lib/format";
import { CrashingScene } from "@/scenes/crashing/scene";
import { CrashingThumbnail } from "@/scenes/crashing/thumbnail";
import type { Lesson } from "../types";
import { lessonBySlug } from "../meta";

const CHEAP_OVERHEAD = 500;

const curve = crashCurve(BOOTH);
const base = schedule(BOOTH);
const name = (id: string) => BOOTH.find((t) => t.id === id)!.name;
const names = (ids: string[]) => ids.map(name).join(" plus ");
const [, first, second] = curve;
const pair = curve.find((p) => p.step && p.step.crashed.length > 1)!.step!;
const best = optimum(curve, DEFAULT_OVERHEAD);
const afterBest = curve[curve.findIndex((p) => p.days === best.days) + 1].step!;
const graphics = BOOTH.find((t) => t.id === "C")!;
/** The task that sets the pace while Graphics has float: the other branch after Design. */
const pacer = BOOTH.find((t) => t.id !== graphics.id && base.float[t.id] === 0 && t.deps.join() === graphics.deps.join())!;
const shortest = curve[curve.length - 1].days;

export const lesson: Lesson = {
  meta: lessonBySlug("crashing"),
  beats: [
    {
      id: "prices",
      title: "Every task has a price for going faster.",
      body: (
        <>
          <Term id="crash">Crashing</Term> pays to shorten a task. Each badge shows its{" "}
          <Term id="slope">cost per day</Term> and <Term id="limit">crash limit</Term>; the lit{" "}
          <Term id="critical">critical path</Term> sets the finish at {days(base.duration)}.
        </>
      ),
      predict: {
        prompt: `Crash ${graphics.name} by a day. Does the booth finish sooner?`,
        options: ["Yes, a day sooner", "No"],
        answer: schedule(shorten(BOOTH, [graphics.id])).duration < base.duration ? 0 : 1,
        why: `It has ${days(base.float[graphics.id])} of float; ${pacer.name} still sets the pace.`,
      },
    },
    {
      id: "cheapest",
      title: "Buy the cheapest critical day.",
      body: (
        <>
          {names(first.step!.crashed)} is the cheapest critical task: {money(first.step!.cost)} buys
          one day, finishing in {days(first.days)}. The <Term id="direct">direct cost</Term>{" "}
          <Term id="point">point</Term> moves one day left and {money(first.step!.cost)} up.
        </>
      ),
      why: (
        <>
          Any critical task cut by a day moves the finish one day, so every option buys the same
          thing. Take the lowest price; non-critical tasks buy nothing.
        </>
      ),
    },
    {
      id: "two-paths",
      title: "Two critical paths: crash the shared task.",
      body: (
        <>
          Both paths are now critical, so a day off one alone saves nothing.{" "}
          <Term id="shared">{names(second.step!.crashed)}</Term> sits on both: {money(second.step!.cost)}{" "}
          beats <Term id="pair">{names(pair.crashed)}</Term> at {money(pair.cost)}.
        </>
      ),
      why: (
        <>
          The finish is the longer path, and both take {days(first.days)}. Cutting only one leaves the
          other at {days(first.days)}, so the finish stays put.
        </>
      ),
    },
    {
      id: "overhead",
      title: "Every day the booth runs costs money.",
      body: (
        <>
          Running the project costs {money(DEFAULT_OVERHEAD)} a day. Each day you cut saves that much{" "}
          <Term id="overhead">overhead</Term>, so its line falls as the schedule shortens.
        </>
      ),
      predict: {
        prompt: `Is the cheapest total at the shortest schedule, ${days(shortest)}?`,
        options: ["Yes", "No, in between", `No, the original ${days(curve[0].days)}`],
        answer: best.days === shortest ? 0 : best.days === curve[0].days ? 2 : 1,
        why: `From ${days(best.days)} on, each day costs more than ${money(DEFAULT_OVERHEAD)}.`,
      },
    },
    {
      id: "stop",
      title: "Stop when crashing costs more than it saves.",
      body: (
        <>
          Direct cost plus overhead is the <Term id="total">total</Term>. It is{" "}
          <Term id="min">lowest</Term> at {days(best.days)}: the next day costs {money(afterBest.cost)},
          more than the {money(DEFAULT_OVERHEAD)} it saves.
        </>
      ),
      why: (
        <>
          Each crashed day costs its step price and saves {money(DEFAULT_OVERHEAD)}. Down to{" "}
          {days(best.days)} every price was lower; the next, {money(afterBest.cost)}, is higher.
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
      why: (
        <>
          Both paths take {days(second.days)} here; {graphics.name} shortens only one, so you pay
          without gaining a day.
        </>
      ),
    },
  ],
  recap: [
    { step: "List each task's cost per day and limit; find the critical path", beat: "prices" },
    { step: "Crash the cheapest critical task one day, then recheck", beat: "cheapest" },
    { step: "When paths tie, shorten all of them at once", beat: "two-paths" },
    { step: "Add daily overhead to direct cost", beat: "overhead" },
    { step: "Stop when the next day costs more than its overhead", beat: "stop" },
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
