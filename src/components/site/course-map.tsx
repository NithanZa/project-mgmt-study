"use client";

import Link from "next/link";
import { domAnimation, LazyMotion, m, stagger, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { CHAPTERS, LESSONS, lessonBySlug } from "@/content/meta";
import type { LessonMeta, Slug } from "@/content/types";
import { lastVisited, useProgress } from "@/lib/progress";
import { FADE, SPRING_AND_FADE } from "@/components/transitions";
import { ProgressRing } from "./progress-ring";

const LIST: Variants = { show: { transition: { delayChildren: stagger(0.025) } } };
// Opacity and transform only, so the entrance never shifts layout.
const CARD: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: SPRING_AND_FADE },
};

const STEPS = [
  { name: "Engine", line: "A small, tested model of the method computes every number." },
  { name: "Scene", line: "An interactive picture of a real scenario redraws as you change it." },
  { name: "Beats", line: "Short steps walk through the idea and end with a quick check." },
];

export function CourseMap({ thumbnails }: { thumbnails: Record<Slug, ReactNode> }) {
  const progress = useProgress();
  const last = lastVisited(progress);
  const done = LESSONS.filter((l) => progress[l.slug]?.completed).length;

  return (
    <LazyMotion features={domAnimation} strict>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-sm text-muted">PM Methods · an interactive course</p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Thirteen ways to finish sooner.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Each method is one idea, one interactive model, about ten minutes.
          </p>
          <div className="mt-2 flex h-11 items-center gap-4">
            <ProgressRing done={done} total={LESSONS.length} />
            <div className="min-w-0 flex-1">
              {last && <ContinueLink lesson={lessonBySlug(last)} />}
            </div>
          </div>
        </header>

        <m.div initial="hidden" animate="show" variants={LIST} className="flex flex-col gap-14">
          {CHAPTERS.map((chapter) => (
            <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`} className="flex flex-col gap-5">
              <div className="flex max-w-2xl flex-col gap-1">
                <p className="text-sm font-medium text-accent">Chapter {chapter.numeral}</p>
                <h2 id={`chapter-${chapter.id}`} className="text-2xl font-semibold tracking-tight">
                  {chapter.title}
                </h2>
                <p className="text-muted">{chapter.blurb}</p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {LESSONS.filter((l) => l.chapter === chapter.id).map((lesson) => (
                  <li key={lesson.slug}>
                    <LessonCard
                      lesson={lesson}
                      thumbnail={thumbnails[lesson.slug]}
                      completed={progress[lesson.slug]?.completed ?? false}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </m.div>

        <section aria-labelledby="how-it-works" className="flex flex-col gap-5 border-t border-line pt-10">
          <h2 id="how-it-works" className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.name} className="flex flex-col gap-1">
                <p className="font-medium">
                  <span className="mr-2 text-sm tabular-nums text-muted">{i + 1}</span>
                  {step.name}
                </p>
                <p className="text-sm text-muted">{step.line}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </LazyMotion>
  );
}

function ContinueLink({ lesson }: { lesson: LessonMeta }) {
  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE} className="flex">
      <Link
        href={`/learn/${lesson.slug}`}
        data-continue
        className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-md bg-accent px-4 text-sm text-surface transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="font-medium">Continue</span>
        <span className="truncate">· {lesson.title}</span>
      </Link>
    </m.div>
  );
}

function LessonCard({
  lesson,
  thumbnail,
  completed,
}: {
  lesson: LessonMeta;
  thumbnail: ReactNode;
  completed: boolean;
}) {
  return (
    <Link
      href={`/learn/${lesson.slug}`}
      data-completed={completed}
      className="group block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <m.div
        variants={CARD}
        whileHover={{ y: -2 }}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors group-hover:border-accent/60"
      >
        <div className="relative flex justify-center border-b border-line py-3">
          <span className="absolute top-3 left-4 text-sm tabular-nums text-muted">
            {String(lesson.number).padStart(2, "0")}
          </span>
          <span className="absolute top-3 right-4 flex size-5 items-center justify-center">
            {completed && (
              <>
                <svg viewBox="0 0 20 20" className="size-5 fill-ok" aria-hidden>
                  <circle cx={10} cy={10} r={10} />
                  <path d="M6 10.5l2.5 2.5L14 7.5" className="fill-none stroke-surface" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">Completed</span>
              </>
            )}
          </span>
          <div aria-hidden className="aspect-[4/3] w-40 *:size-full">
            {thumbnail}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-semibold leading-snug">{lesson.title}</h3>
          <p className="text-sm text-muted">{lesson.tagline}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2">
            <span className="rounded-full border border-accent/40 px-2.5 py-0.5 text-xs font-medium text-accent">
              {lesson.improves}
            </span>
            <span className="text-xs text-muted">{lesson.scenario}</span>
          </div>
        </div>
      </m.div>
    </Link>
  );
}
