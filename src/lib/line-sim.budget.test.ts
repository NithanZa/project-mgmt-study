import { expect, it } from "vitest";
import { drum } from "@/engine/dbr/config";
import { limited } from "@/engine/kanban/config";
import { OUTAGE } from "@/engine/kanban/fixture";
import { baseline } from "@/engine/toc/scenarios";
import { simulateLine, type LineConfig } from "./line-sim";

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

// Each lesson's line at 80 ticks with full noise; the bakery push line piles up the most items.
const lines: [string, LineConfig][] = [
  ["toc bakery push", { ...baseline(), variability: 1 }],
  ["dbr drum", drum(12, 1)],
  ["kanban limited + outage", limited(3, 1, OUTAGE)],
];

it.each(lines)("simulates 80 ticks of %s in under 5 ms", (name, config) => {
  const run = { ...config, ticks: 80 };
  const ms = medianMs(() => simulateLine(run));
  console.info(`line-sim ${name} 80 ticks: ${ms.toFixed(3)} ms`);
  expect(ms).toBeLessThan(5);
});
