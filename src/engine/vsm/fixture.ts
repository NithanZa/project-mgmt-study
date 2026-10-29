import type { Improvement, Step, StepId } from "./types";

export const HOURS_PER_DAY = 8;

export const HIRING: readonly Step[] = [
  { id: "resume", name: "Resume screen", processHours: 0.5, waitDays: 3, waste: "batching", reason: "Resumes are screened in a weekly batch." },
  { id: "phone", name: "Phone screen", processHours: 1, waitDays: 4, waste: "handoff", reason: "Calendar ping-pong between recruiter and hiring manager." },
  { id: "takeHome", name: "Take-home", processHours: 4, waitDays: 5, waste: "handoff", reason: "The candidate has a week; reviewers pick it up late." },
  { id: "onsite", name: "Onsite", processHours: 5, waitDays: 7, waste: "waiting", reason: "Five interviewers' calendars must align." },
  { id: "debrief", name: "Debrief", processHours: 1, waitDays: 2, waste: "batching", reason: "It waits for the next team meeting." },
  { id: "offer", name: "Offer", processHours: 0.5, waitDays: 3, waste: "approval", reason: "The offer goes up an approval chain." },
];

/** Caps the wait before the given steps; capping never lengthens a wait, so it is idempotent. */
const capWait =
  (ids: readonly StepId[], days: number) =>
  (steps: readonly Step[]): Step[] =>
    steps.map((s) => (ids.includes(s.id) ? { ...s, waitDays: Math.min(s.waitDays, days) } : s));

export const IMPROVEMENTS: readonly Improvement[] = [
  { id: "takeHomeFastReview", label: "Take-home 1 d", apply: capWait(["takeHome"], 1) },
  { id: "onsiteWithinTwoDays", label: "Onsite 2 d", apply: capWait(["onsite"], 2) },
  { id: "sameDayDebrief", label: "Debrief 0 d", apply: capWait(["debrief"], 0) },
  { id: "offerApprovalOneDay", label: "Offer 1 d", apply: capWait(["offer"], 1) },
  { id: "screensWithinOneDay", label: "Screens 1 d", apply: capWait(["resume", "phone"], 1) },
];
