"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { LESSONS } from "@/content/meta";
import type { Slug } from "@/content/types";
import { useProgress } from "@/lib/progress";

/** Keeps the hover label inside the viewport at both ends of the rail. */
function tooltipAlign(i: number): string {
  if (i < 4) return "left-0";
  if (i > LESSONS.length - 5) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

/** One tick per lesson in registry order; a shared indicator marks the current one. */
export function ProgressRail({ current }: { current: Slug }) {
  const progress = useProgress();

  return (
    <nav aria-label="Lessons" className="mx-auto w-full max-w-7xl px-4 pt-1 lg:px-8 lg:pt-2">
      <ol className="flex">
        {LESSONS.map((lesson, i) => {
          const isCurrent = lesson.slug === current;
          const done = progress[lesson.slug]?.completed ?? false;
          const newChapter = i > 0 && lesson.chapter !== LESSONS[i - 1].chapter;
          return (
            <li key={lesson.slug} className={`min-w-0 flex-1 ${newChapter ? "ml-1.5" : ""}`}>
              <Link
                href={`/learn/${lesson.slug}`}
                aria-label={`Lesson ${lesson.number}: ${lesson.title}${done ? ", completed" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
                className="group relative flex h-6 items-center px-px focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent"
              >
                {/* Completed ticks are thicker as well as green. */}
                <span
                  className={`block w-full rounded-full transition-colors ${done ? "h-1.5 bg-ok/60" : "h-1 bg-line group-hover:bg-muted"}`}
                />
                {isCurrent && (
                  <motion.span
                    layoutId="lesson-rail-indicator"
                    className="absolute inset-x-px inset-y-0 my-auto h-1.5 rounded-full bg-accent"
                  />
                )}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-full z-20 hidden rounded-md border border-line bg-surface px-2 py-1 text-xs whitespace-nowrap text-fg shadow-sm group-hover:block group-focus-visible:block ${tooltipAlign(i)}`}
                >
                  {lesson.number} · {lesson.title}
                  {done && " ✓"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
