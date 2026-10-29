/** Linear map from [d0, d1] to [r0, r1]. */
export const linear = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

export const FADE = { duration: 0.18, ease: "easeOut" } as const;
/** Global spring for position and size, 180 ms fade for opacity. */
export const MOTION = { default: { type: "spring", bounce: 0.2, visualDuration: 0.4 }, opacity: FADE } as const;
