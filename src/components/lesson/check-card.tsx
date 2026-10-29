"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { FADE } from "@/components/transitions";
import type { Check } from "@/content/types";

export interface CheckCardProps {
  check: Check;
  completed: boolean;
  onCorrect: () => void;
}

export function CheckCard({ check, completed, onCorrect }: CheckCardProps) {
  const id = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === check.answer;

  return (
    <fieldset className="rounded-lg border border-line bg-surface p-4">
      <legend className="px-1 text-xs uppercase tracking-wide text-muted">
        Check {completed && <span className="text-ok">· ✓ completed</span>}
      </legend>
      <p id={`${id}-q`} className="mb-3 font-medium">
        {check.question}
      </p>
      <div role="radiogroup" aria-labelledby={`${id}-q`} className="flex flex-col gap-2">
        {check.options.map((option, i) => {
          const isPicked = picked === i;
          const mark = isPicked ? (i === check.answer ? "✓" : "✗") : "";
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                isPicked
                  ? i === check.answer
                    ? "border-ok text-fg"
                    : "border-constraint text-fg"
                  : "border-line text-fg hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name={`${id}-option`}
                checked={isPicked}
                onChange={() => {
                  setPicked(i);
                  if (i === check.answer) onCorrect();
                }}
                className="accent-[var(--accent)]"
              />
              <span className="flex-1">{option}</span>
              <span
                aria-hidden
                className={i === check.answer ? "text-ok" : "text-constraint"}
              >
                {mark}
              </span>
            </label>
          );
        })}
      </div>
      <div aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {answered && (
            <motion.p
              key={correct ? "right" : "wrong"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="mt-3 text-sm text-muted"
            >
              {correct ? (
                <>
                  <span className="font-medium text-ok">Correct.</span> {check.why}
                </>
              ) : (
                <span className="font-medium text-constraint">Not quite. Try another answer.</span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </fieldset>
  );
}
