"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { Term } from "@/components/lesson/term";
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

const rows = base.rows;
const order = task("D");
const install = task("G");
const weekOf = (n: number) => `week ${n}`;
const weeksOf = (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`;

/** Install equipment starts when the later of its two inputs ends. */
const startOptions = [rows.D.ef, rows.G.es, rows.C.ef + rows.D.ef];
/** Order equipment must finish before the earlier of its successors starts. */
const finishOptions = [rows.F.ls, rows.G.ls, base.duration];
/** Shortening a task with float only adds float. */
const quickOrder = computeCriticalPath(withWeeks(COFFEE_SHOP, "D", 1));
const gainOptions = [0, 1, 2];

const list = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0];

export const lesson: Lesson = {
  meta: lessonBySlug("cpm"),
  beats: [
    {
      id: "network",
      title: "Arrows show which task waits for which.",
      body: "Each arrow means a task cannot start until the one behind it ends. Hover or focus a task to see what it waits for.",
      predict: {
        prompt: `${install.name} waits for ${reno.name} (ends week ${rows.C.ef}) and ${order.name} (ends week ${rows.D.ef}). When can it start?`,
        options: startOptions.map(weekOf),
        answer: startOptions.indexOf(rows.G.es),
        why: "A task needs every input, so it waits for the latest finish.",
      },
    },
    {
      id: "forward",
      title: "Walk forward for the earliest start.",
      body: (
        <>
          Each task starts (<Term id="es-ef">ES</Term>, above left) when its{" "}
          <Term id="merge">last predecessor</Term> finishes (<Term id="es-ef">EF</Term>, above
          right). The last finish is week {base.duration}: the earliest opening.
        </>
      ),
      why: (
        <>
          A task needs all its inputs, so its earliest start is the largest finish among its
          predecessors. The project ends when the last task does.
        </>
      ),
      predict: {
        prompt: `${order.name} feeds two tasks that must start by week ${rows.F.ls} and week ${rows.G.ls}. Latest it can finish?`,
        options: finishOptions.map(weekOf),
        answer: finishOptions.indexOf(rows.D.lf),
        why: "Finishing later would delay the earlier successor.",
      },
    },
    {
      id: "backward",
      title: "Walk backward for the latest start.",
      body: (
        <>
          From week {base.duration}, each task gets the latest start (<Term id="ls-lf">LS</Term>) and
          finish (<Term id="ls-lf">LF</Term>) that keeps the opening. The gap is{" "}
          <Term id="float">float</Term>: {list(floats.map((t) => `${t.id} ${base.rows[t.id].float}`))}{" "}
          weeks.
        </>
      ),
      why: (
        <>
          A task must finish before its earliest-needed successor starts, so LF is the smallest
          successor LS. Float = LS − ES.
        </>
      ),
    },
    {
      id: "critical",
      title: "Zero float is the critical path.",
      body: (
        <>
          {base.criticalPaths[0].join(" ")} has <Term id="critical-path">no float</Term>, so any
          delay there moves the opening past <Term id="opening">week {base.duration}</Term>. The
          strip below shows float as <Term id="float">dashed ghosts</Term>.
        </>
      ),
      predict: {
        prompt: `${order.name} drops from ${order.weeks} to 1 week. The opening moves earlier by…`,
        options: gainOptions.map(weeksOf),
        answer: gainOptions.indexOf(base.duration - quickOrder.duration),
        why: `${order.id} is not critical; its saved time becomes float.`,
      },
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
      why: (
        <>
          Float belongs to a path, not a task: {reno.name} and {install.name} share the same{" "}
          {renoFloat} weeks. Spend them on one and the other has none.
        </>
      ),
    },
  ],
  recap: [
    { step: "List the tasks and what each one waits for", beat: "network" },
    { step: "Forward: ES is the largest predecessor EF", beat: "forward" },
    { step: "The project ends at the largest EF", beat: "forward" },
    { step: "Backward: LF is the smallest successor LS", beat: "backward" },
    { step: "Float is LS minus ES", beat: "backward" },
    { step: "The zero-float chain is critical: watch it", beat: "critical" },
  ],
  Scene: CriticalPathScene,
  Thumbnail,
  check: {
    question: `${reno.name} slips by ${renoFloat} weeks. The opening moves by…`,
    options: checkOptions.map(weeksOf),
    answer: checkOptions.indexOf(slip),
    why: `${reno.name}'s ${renoFloat} weeks of float absorb the slip.`,
  },
};

export default function CpmLesson() {
  return <LessonShell lesson={lesson} />;
}
