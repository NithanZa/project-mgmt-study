"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { FADE } from "@/components/transitions";
import type { Predict } from "@/content/types";

/** A low-stakes guess before the beat's result; the answer always shows after a pick. */
export function PredictCard({ predict }: { predict: Predict }) {
  const id = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === predict.answer;

  return (
    <fieldset className="mt-4 rounded-lg border border-dashed border-line p-4">
      <legend className="px-1 text-xs uppercase tracking-wide text-muted">Predict</legend>
      <p id={`${id}-q`} className="mb-3 text-sm font-medium">
        {predict.prompt}
      </p>
      <div role="radiogroup" aria-labelledby={`${id}-q`} className="flex flex-col gap-2">
        {predict.options.map((option, i) => {
          const isPicked = picked === i;
          const isAnswer = i === predict.answer;
          return (
            <label
              key={option}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm text-fg ${
                answered && isAnswer
                  ? "border-ok"
                  : isPicked
                    ? "border-constraint"
                    : answered
                      ? "border-line"
                      : "cursor-pointer border-line hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name={`${id}-option`}
                checked={isPicked}
                disabled={answered}
                onChange={() => setPicked(i)}
                className="accent-[var(--accent)]"
              />
              <span className="flex-1">{option}</span>
              <span aria-hidden className={isAnswer ? "text-ok" : "text-constraint"}>
                {answered && isAnswer ? "✓" : isPicked ? "✗" : ""}
              </span>
            </label>
          );
        })}
      </div>
      <div aria-live="polite">
        <AnimatePresence initial={false}>
          {answered && (
            <motion.p
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="mt-3 text-sm text-muted"
            >
              {correct ? (
                <span className="font-medium text-ok">Right.</span>
              ) : (
                <span className="font-medium text-constraint">Not quite.</span>
              )}{" "}
              {predict.why}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </fieldset>
  );
}
