import type { Transition } from "motion/react";

/** Opacity timing from the quality bar. */
export const FADE = { duration: 0.18, ease: "easeOut" } as const;

/** Per-animation override: opacity fades, every other value keeps the MotionConfig spring. */
export const SPRING_AND_FADE: Transition = { inherit: true, opacity: FADE };
