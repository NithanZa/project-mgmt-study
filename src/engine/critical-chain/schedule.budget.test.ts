import { expect, it } from "vitest";
import { REDESIGN } from "./fixture";
import { bestFeasible } from "./schedule";

/** Median of five timed calls after one warm-up call. */
function medianMs(run: () => void): number {
  run();
  const samples = Array.from({ length: 5 }, () => {
    const start = performance.now();
    run();
    return performance.now() - start;
  });
  return samples.sort((a, b) => a - b)[2];
}

it.each(["safe", "aggressive"] as const)("finds the best feasible %s schedule in under 50 ms", (mode) => {
  // A fresh array each call: `bestFeasible` memoises by task-array identity.
  const ms = medianMs(() => bestFeasible([...REDESIGN], mode));
  console.info(`critical-chain bestFeasible ${mode}: ${ms.toFixed(2)} ms`);
  expect(ms).toBeLessThan(50);
});
