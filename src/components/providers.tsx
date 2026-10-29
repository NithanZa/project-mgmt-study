"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", bounce: 0.2, visualDuration: 0.4 }}
    >
      {children}
    </MotionConfig>
  );
}
