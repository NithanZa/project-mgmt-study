import type { Chapter, ChapterId, LessonMeta, Slug } from "./types";

export const CHAPTERS: Chapter[] = [
  {
    id: "baseline",
    numeral: "I",
    title: "The baseline",
    blurb: "Every schedule starts with tasks, dependencies and the chain that sets the date.",
  },
  {
    id: "uncertainty",
    numeral: "II",
    title: "Time under uncertainty",
    blurb: "Durations are guesses. Treat them as ranges and the date becomes a probability.",
  },
  {
    id: "faster",
    numeral: "III",
    title: "Going faster",
    blurb: "Overlap, spend or resequence work to pull the finish date in.",
  },
  {
    id: "people",
    numeral: "IV",
    title: "Limited people",
    blurb: "A plan that overloads someone is not a plan. Schedule around the people you have.",
  },
  {
    id: "flow",
    numeral: "V",
    title: "Flow, not tasks",
    blurb: "For repeating work, manage the flow through the system rather than each task.",
  },
];

export const LESSONS: LessonMeta[] = [
  {
    slug: "cpm",
    number: 1,
    title: "Critical Path Method",
    tagline: "The longest chain of dependent tasks sets the finish date.",
    improves: "Knowing which tasks move the date",
    scenario: "Opening a coffee shop",
    chapter: "baseline",
  },
  {
    slug: "pert",
    number: 2,
    title: "PERT",
    tagline: "Three estimates give an expected duration and a spread you can commit against.",
    improves: "Honest deadlines",
    scenario: "A database migration",
    chapter: "uncertainty",
  },
  {
    slug: "monte-carlo",
    number: 3,
    title: "Monte Carlo Schedule Simulation",
    tagline: "Simulate the whole network; parallel uncertainty pushes the finish later.",
    improves: "Realistic finish dates",
    scenario: "A conference launch",
    chapter: "uncertainty",
  },
  {
    slug: "fast-tracking",
    number: 4,
    title: "Fast Tracking",
    tagline: "Overlapping sequential work saves time only up to a point.",
    improves: "Schedule length",
    scenario: "Building a house",
    chapter: "faster",
  },
  {
    slug: "crashing",
    number: 5,
    title: "Project Crashing",
    tagline: "Buy the cheapest critical day, and stop when a day costs more than it saves.",
    improves: "Cost of speed",
    scenario: "A trade show booth",
    chapter: "faster",
  },
  {
    slug: "dsm",
    number: 6,
    title: "Design Structure Matrix",
    tagline: "A matrix of dependencies reveals the order that minimizes rework.",
    improves: "Rework from feedback loops",
    scenario: "Developing a bike",
    chapter: "faster",
  },
  {
    slug: "resource-leveling",
    number: 7,
    title: "Resource Leveling",
    tagline: "Trade float, then time, until nobody is overbooked.",
    improves: "Feasible workloads",
    scenario: "Three features, one designer",
    chapter: "people",
  },
  {
    slug: "rcpsp",
    number: 8,
    title: "Resource-Constrained Project Scheduling",
    tagline: "With limited people, scheduling is a search; rules only guess.",
    improves: "Shortest feasible schedule",
    scenario: "A game jam team",
    chapter: "people",
  },
  {
    slug: "critical-chain",
    number: 9,
    title: "Critical Chain (CCPM)",
    tagline: "Schedule the resource-constrained chain and protect it with shared buffers.",
    improves: "On-time delivery",
    scenario: "A website redesign",
    chapter: "people",
  },
  {
    slug: "toc",
    number: 10,
    title: "Theory of Constraints",
    tagline: "Improving anything but the constraint does nothing for throughput.",
    improves: "Throughput",
    scenario: "A bakery line",
    chapter: "flow",
  },
  {
    slug: "dbr",
    number: 11,
    title: "Drum-Buffer-Rope",
    tagline: "Release work at the constraint's beat and protect it with a buffer.",
    improves: "Flow through the constraint",
    scenario: "A machine shop",
    chapter: "flow",
  },
  {
    slug: "kanban",
    number: 12,
    title: "Kanban and WIP Limits",
    tagline: "Start less work and work finishes sooner: cycle time = WIP ÷ throughput.",
    improves: "Cycle time",
    scenario: "A product team board",
    chapter: "flow",
  },
  {
    slug: "vsm",
    number: 13,
    title: "Value Stream Mapping",
    tagline: "Most lead time is waiting; map the stream and remove the waits first.",
    improves: "Lead time",
    scenario: "Hiring an engineer",
    chapter: "flow",
  },
];

const BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));

export function isSlug(value: string): value is Slug {
  return BY_SLUG.has(value as Slug);
}

export function lessonBySlug(slug: Slug): LessonMeta {
  return BY_SLUG.get(slug)!;
}

export function chapterById(id: ChapterId): Chapter {
  return CHAPTERS.find((c) => c.id === id)!;
}

export function nextLesson(slug: Slug): LessonMeta | undefined {
  return LESSONS[lessonBySlug(slug).number];
}

export function prevLesson(slug: Slug): LessonMeta | undefined {
  const n = lessonBySlug(slug).number;
  return n > 1 ? LESSONS[n - 2] : undefined;
}
