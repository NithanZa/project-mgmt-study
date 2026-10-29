import type { ComponentType, ReactNode } from "react";

export type Slug =
  | "cpm"
  | "pert"
  | "monte-carlo"
  | "fast-tracking"
  | "crashing"
  | "dsm"
  | "resource-leveling"
  | "rcpsp"
  | "critical-chain"
  | "toc"
  | "dbr"
  | "kanban"
  | "vsm";

export type ChapterId = "baseline" | "uncertainty" | "faster" | "people" | "flow";

export interface Chapter {
  id: ChapterId;
  numeral: string;
  title: string;
  blurb: string;
}

export interface LessonMeta {
  slug: Slug;
  number: number;
  title: string;
  tagline: string;
  improves: string;
  scenario: string;
  chapter: ChapterId;
}

export interface Beat {
  id: string;
  title: string;
  body: ReactNode;
}

export interface Check {
  question: string;
  options: string[];
  answer: number;
  why: string;
}

export interface SceneProps {
  beat: number;
}

export interface Lesson {
  meta: LessonMeta;
  beats: Beat[];
  Scene: ComponentType<SceneProps>;
  Thumbnail: ComponentType;
  check: Check;
}
