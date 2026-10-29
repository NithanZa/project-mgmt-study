"use client";

import { useSyncExternalStore } from "react";
import type { Slug } from "@/content/types";

export interface LessonProgress {
  beat: number;
  completed: boolean;
  visitedAt: number;
}

export type Progress = Partial<Record<Slug, LessonProgress>>;

const KEY = "pms.progress.v1";
const EMPTY: Progress = {};
const listeners = new Set<() => void>();

let cache: { raw: string | null; value: Progress } | null = null;

function read(): Progress {
  const raw = window.localStorage.getItem(KEY);
  if (cache && cache.raw === raw) return cache.value;
  let value: Progress = EMPTY;
  try {
    value = raw ? (JSON.parse(raw) as Progress) : EMPTY;
  } catch {
    value = EMPTY;
  }
  cache = { raw, value };
  return value;
}

function write(next: Progress) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function update(slug: Slug, patch: Partial<LessonProgress>) {
  const current = read();
  const entry = current[slug] ?? { beat: 0, completed: false, visitedAt: 0 };
  write({ ...current, [slug]: { ...entry, ...patch, visitedAt: Date.now() } });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Progress for every lesson; empty during server render and hydration. */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Records a visit without changing the beat. */
export function visit(slug: Slug) {
  update(slug, {});
}

export function setBeat(slug: Slug, beat: number) {
  update(slug, { beat });
}

export function markComplete(slug: Slug) {
  update(slug, { completed: true });
}

export function lastVisited(progress: Progress): Slug | undefined {
  let best: Slug | undefined;
  let at = 0;
  for (const [slug, entry] of Object.entries(progress) as [Slug, LessonProgress][]) {
    if (entry.visitedAt > at) {
      at = entry.visitedAt;
      best = slug;
    }
  }
  return best;
}
