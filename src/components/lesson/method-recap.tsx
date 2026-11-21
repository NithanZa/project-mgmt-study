"use client";

import type { Beat, RecapStep } from "@/content/types";

export interface MethodRecapProps {
  steps: RecapStep[];
  beats: Beat[];
  onJump: (index: number) => void;
}

/** The method as a numbered list; each step jumps back to the beat that showed it. */
export function MethodRecap({ steps, beats, onJump }: MethodRecapProps) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <p className="mb-3 px-1 text-xs uppercase tracking-wide text-muted">
        The method in {steps.length} steps
      </p>
      <ol aria-label="How to apply the method" className="flex flex-col gap-2">
        {steps.map((step, n) => {
          const index = beats.findIndex((b) => b.id === step.beat);
          return (
            <li key={step.beat + n} className="flex items-center gap-3 text-sm">
              <span className="w-4 shrink-0 text-right tabular-nums text-muted">{n + 1}.</span>
              <span className="flex-1">{step.step}</span>
              {index >= 0 && (
                <button
                  type="button"
                  aria-label={`Go to step ${index + 1}: ${beats[index].title}`}
                  onClick={() => onJump(index)}
                  className="inline-flex h-7 shrink-0 items-center rounded-md border border-line px-2 text-xs text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  step {index + 1}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
