"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import { FADE } from "@/components/transitions";

/** A "Why?" toggle that reveals the mechanism behind the beat. */
export function WhyDisclosure({ children }: { children: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <motion.span
          aria-hidden
          className="inline-block text-[0.6rem]"
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
        >
          ▶
        </motion.span>
        Why?
      </button>
      <div id={id}>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="why"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="mt-2 text-sm leading-relaxed text-muted"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
