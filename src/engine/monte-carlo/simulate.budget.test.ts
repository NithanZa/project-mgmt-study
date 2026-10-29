import { expect, it } from "vitest";
import { MAX_STREAMS } from "./fixture";
import { simulate } from "./simulate";

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

it("simulates 5000 runs of the largest network in under 100 ms", () => {
  const ms = medianMs(() => simulate({ streams: MAX_STREAMS, rush: true, runs: 5000, seed: 7 }));
  console.info(`monte-carlo 5000 runs: ${ms.toFixed(2)} ms`);
  expect(ms).toBeLessThan(100);
});
