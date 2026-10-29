import { expect, it } from "vitest";
import { CAPACITIES, GAME_JAM } from "./fixture";
import { exhaustive } from "./search";

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

it("searches every priority order in under 150 ms", () => {
  // A fresh array each call: `exhaustive` memoises by task-array identity.
  const ms = medianMs(() => exhaustive([...GAME_JAM], CAPACITIES));
  console.info(`rcpsp exhaustive (${exhaustive([...GAME_JAM], CAPACITIES).evaluated} orders): ${ms.toFixed(2)} ms`);
  expect(ms).toBeLessThan(150);
});
