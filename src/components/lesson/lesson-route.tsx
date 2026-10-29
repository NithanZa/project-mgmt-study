"use client";

import { LESSON_COMPONENTS } from "@/content/lessons";
import type { Slug } from "@/content/types";

/** Client boundary so each lesson's `dynamic()` import gets its own chunk. */
export function LessonRoute({ slug }: { slug: Slug }) {
  const Lesson = LESSON_COMPONENTS[slug];
  return <Lesson />;
}
