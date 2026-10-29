export type StepId = "resume" | "phone" | "takeHome" | "onsite" | "debrief" | "offer";

export type Waste = "batching" | "handoff" | "waiting" | "approval";

export interface Step {
  id: StepId;
  name: string;
  processHours: number;
  /** Days the candidate waits before this step starts. */
  waitDays: number;
  waste: Waste;
  /** Why the wait happens. */
  reason: string;
}

export type ImprovementId =
  | "takeHomeFastReview"
  | "onsiteWithinTwoDays"
  | "sameDayDebrief"
  | "offerApprovalOneDay"
  | "screensWithinOneDay";

export interface Improvement {
  id: ImprovementId;
  label: string;
  apply(steps: readonly Step[]): Step[];
}
