export const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.4 } as const;
export const FADE = { duration: 0.18, ease: "easeOut" } as const;
/** Springs for geometry, a short fade for opacity. */
export const MOVE = { default: SPRING, opacity: FADE } as const;
