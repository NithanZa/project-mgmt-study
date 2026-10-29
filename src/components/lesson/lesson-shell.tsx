"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, ViewTransition } from "react";
import { chapterById, nextLesson, prevLesson } from "@/content/meta";
import type { Lesson } from "@/content/types";
import { markComplete, setBeat, useProgress, visit } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ShortcutsDialog } from "@/components/site/shortcuts-dialog";
import { FADE, SPRING_AND_FADE } from "@/components/transitions";
import { CheckCard } from "./check-card";
import { ProgressRail } from "./progress-rail";
import { SceneAnnouncer } from "./scene-announcer";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [role="slider"], [contenteditable=""], [contenteditable="true"]',
    ),
  );
}

export function LessonShell({ lesson }: { lesson: Lesson }) {
  const { meta, beats, Scene, check } = lesson;
  const router = useRouter();
  const progress = useProgress()[meta.slug];
  const last = beats.length - 1;
  const index = Math.min(Math.max(progress?.beat ?? 0, 0), last);
  const beat = beats[index];
  const next = nextLesson(meta.slug);
  const prev = prevLesson(meta.slug);
  const chapter = chapterById(meta.chapter);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shortcutsTrigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    visit(meta.slug);
  }, [meta.slug]);

  // A layout effect so keys work as soon as the lesson commits: passive effects
  // wait for the route's view transition to finish.
  useLayoutEffect(() => {
    if (shortcutsOpen) return;
    const go = (to: number) => setBeat(meta.slug, Math.min(Math.max(to, 0), last));
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (isEditable(e.target)) return;
      // `?` needs Shift on most layouts, so match it before the Shift guard.
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (e.shiftKey) return;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "n" && next) router.push(`/learn/${next.slug}`);
      else if (e.key === "p" && prev) router.push(`/learn/${prev.slug}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [meta.slug, index, last, next, prev, router, shortcutsOpen]);

  return (
    <>
      <ProgressRail current={meta.slug} />
      {/* React runs enter/exit only for a ViewTransition with no DOM parent inside the
          swapped subtree, so it wraps the grid that holds the lesson column and scene panel. */}
      <ViewTransition enter="lesson" exit="lesson" default="none">
        <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 pb-10 lg:grid-cols-[minmax(20rem,26rem)_1fr] lg:gap-8 lg:px-8 lg:pt-3 lg:pb-6">
          <section
            aria-label="Interactive model"
            className="sticky top-0 z-10 -mx-4 bg-bg px-4 pt-3 pb-2 lg:static lg:order-2 lg:m-0 lg:p-0"
          >
            <div
              ref={panel}
              className="aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface lg:aspect-auto lg:h-[calc(100dvh-4rem)] lg:max-h-[52rem]"
            >
              <Scene beat={index} />
            </div>
          </section>

          <article className="flex flex-col gap-5 lg:order-1">
            <header className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <Link href="/" className="text-xs text-muted hover:text-fg">
                  ← PM Methods
                </Link>
                <button
                  ref={shortcutsTrigger}
                  type="button"
                  aria-label="Keyboard shortcuts"
                  aria-haspopup="dialog"
                  onClick={() => setShortcutsOpen(true)}
                  className="inline-flex size-7 items-center justify-center rounded-md border border-line font-mono text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  ?
                </button>
              </div>
              <p className="text-xs uppercase tracking-wide text-muted">
                {chapter.numeral}. {chapter.title}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Lesson {meta.number} · {meta.title}
              </h1>
              <p className="text-sm text-muted">Scenario: {meta.scenario}</p>
            </header>

            <div className="min-h-36" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={beat.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: SPRING_AND_FADE }}
                  exit={{ opacity: 0, transition: FADE }}
                >
                  <p className="mb-1 text-xs tabular-nums text-muted">
                    Step {index + 1} of {beats.length}
                  </p>
                  <h2 className="mb-2 text-xl font-semibold">{beat.title}</h2>
                  <div className="text-[0.95rem] leading-relaxed text-fg">{beat.body}</div>
                </motion.div>
              </AnimatePresence>
            </div>

            <nav aria-label="Lesson steps" className="flex flex-col gap-3">
              <ol className="flex gap-1.5">
                {beats.map((b, i) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      aria-label={`Step ${i + 1}: ${b.title}`}
                      aria-current={i === index ? "step" : undefined}
                      onClick={() => setBeat(meta.slug, i)}
                      className="flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <span
                        className={`block h-2 rounded-full transition-colors ${i === index ? "w-5 bg-accent" : i < index ? "w-2 bg-fg/50" : "w-2 bg-line"}`}
                      />
                    </button>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2">
                {/* aria-disabled, not disabled, so a focused button keeps focus at either end. */}
                <Button
                  aria-disabled={index === 0}
                  onClick={() => setBeat(meta.slug, index - 1)}
                >
                  <Kbd>←</Kbd> Prev
                </Button>
                <Button
                  variant="primary"
                  aria-disabled={index === last}
                  onClick={() => setBeat(meta.slug, index + 1)}
                >
                  Next <Kbd>→</Kbd>
                </Button>
              </div>
            </nav>

            {index === last && (
              <div className="flex flex-col gap-4">
                <CheckCard
                  key={meta.slug}
                  check={check}
                  completed={progress?.completed ?? false}
                  onCorrect={() => markComplete(meta.slug)}
                />
                <nav
                  aria-label="Course"
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
                >
                  {next && (
                    <Link
                      href={`/learn/${next.slug}`}
                      className="font-medium text-accent hover:underline"
                    >
                      Next: {next.number} · {next.title} →
                    </Link>
                  )}
                  <Link href="/" className="text-muted hover:text-fg hover:underline">
                    Back to the map
                  </Link>
                </nav>
              </div>
            )}
          </article>
        </main>
      </ViewTransition>
      <SceneAnnouncer panel={panel} beat={index} />
      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        returnFocus={shortcutsTrigger}
      />
    </>
  );
}
