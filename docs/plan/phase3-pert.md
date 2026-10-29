# PM Methods Interactive Course

## Outcome

Lesson 2, PERT, is complete at `/learn/pert`. The learner estimates a database
migration with three-point estimates, sees why the expected value leans toward
the pessimistic tail, sums expectations and variances along a single chain, and
reads the probability of hitting a deadline. Insight: durations are uncertain;
three estimates give an expected value and a spread you can commit against.

Scenario (days, five sequential tasks). Verified.

| task            | o | m | p  | expected | variance |
| --------------- | - | - | -- | -------- | -------- |
| Audit           | 1 | 2 | 4  | 2.17     | 0.250    |
| Schema design   | 2 | 3 | 7  | 3.50     | 0.694    |
| Write migration | 3 | 5 | 12 | 5.83     | 2.250    |
| Dry run         | 1 | 2 | 5  | 2.33     | 0.444    |
| Cutover         | 1 | 1 | 3  | 1.33     | 0.111    |

Sum of most-likely values 13. Expected total 15.17, sigma 1.936.
P(≤13) = 13%, P(≤15) = 47%, P(≤17) = 83%, P(≤18) = 93%, P(≤20) = 99%.
Days for 50 / 80 / 90 / 95% confidence: 15.2 / 16.8 / 17.7 / 18.4.
With Write migration's pessimistic estimate raised to 20: expected 16.5,
sigma 3.09, P(≤17) = 56%.

## Step-by-step

1. **Engine** `src/engine/pert/`:
   - `types.ts`: `Estimate { o; m; p }`, `PertTask { id; name; estimate }`.
   - `fixture.ts`: `MIGRATION: PertTask[]`.
   - `pert.ts`: `expected(e)`, `variance(e)`, `betaShape(e): { alpha; beta }`
     (`alpha = 1 + 4(m - o)/(p - o)`, `beta = 1 + 4(p - m)/(p - o)`),
     `betaPertPdf(e, x)` for drawing, `projectEstimate(tasks): { modeSum; expected; sigma; probabilityBy(days); daysFor(confidence) }`
     using `normalCdf` and `normalQuantile` from `src/lib/stats.ts`.
     `withEstimate(tasks, id, estimate)` immutable helper.
   - `pert.test.ts`: the table; `modeSum` 13; expected 15.17 ±0.01; sigma
     1.936 ±0.001; the five probabilities ±0.005; `daysFor(0.8)` 16.8 ±0.05;
     the p = 20 variant; `betaPertPdf` integrates to 1 ±0.01 over [o, p].

2. **Scene** `src/scenes/pert/`:
   - `estimate-row.tsx`: one row per task: name, a horizontal range bar from o
     to p on a shared 0 to 20-day axis, a tick at m, a filled beta curve inside
     the range (SVG path, `motion.path` animating `d`), and an expected-value
     marker that slides from m to the expected value when revealed.
   - `project-curve.tsx`: a normal curve over the same axis with the mean
     marker, a shaded area up to the chosen deadline, and a draggable deadline
     line (`drag="x"`, snapped to 0.5 days, keyboard arrows move it).
   - `scene.tsx`: beats 1 to 3 stack the five rows; beat 3 morphs the five
     curves into the single project curve (rows shrink into a strip above the
     curve with `layout`). Readouts: "Expected 15.2 d", "Sigma 1.9 d",
     "P(by deadline) 83%". Controls: deadline slider 12 to 21 (beat 4),
     confidence `Segmented` 50 / 80 / 90 / 95% (beat 4), pessimistic slider for
     Write migration 6 to 20 (beat 5), Reset.
   - `thumbnail.tsx`: static project curve with a deadline shade.

3. **Beats** in `src/content/lessons/pert.tsx`:
   1. *Three numbers beat one guess.* Ranges with the mode ticks; the readout
      shows the sum of most-likely values, 13, the number people promise.
   2. *The expected value leans toward the tail.* Beta curves fade in; the
      expected markers slide right of the mode; Write migration shows 5 → 5.8.
   3. *Add up expectations and variances along the chain.* Rows morph into the
      project curve: mean 15.2, sigma 1.9; the 13-day promise shades 13%.
   4. *Commit at the confidence you can live with.* Deadline slider and
      confidence control; 80% needs 16.8 days.
   5. *Try it: widen one pessimistic estimate.* Raising Write migration's p to
      20 moves the mean to 16.5 and drops P(≤17) from 83% to 56%; one wide tail
      dominates the spread.
   Check: "A task is estimated 2 / 4 / 12 days. PERT expected duration?"
   options 4 / 5 / 6, answer 5, why: (2 + 16 + 12) / 6.

4. **Register**, verify in the browser (the morph in beat 3 must keep the axis
   fixed so markers do not jump; the deadline line drags and snaps), commit
   (`feat(lesson): pert`), push.

## Acceptance criteria

- [x] AC1: `projectEstimate(MIGRATION)` returns modeSum 13, expected 15.17 ±0.01, sigma 1.936 ±0.001, and `probabilityBy(17)` 0.828 ±0.005.
- [x] AC2: Beat 2 shows an expected marker right of the mode for every task, with Write migration reading 5.8.
- [x] AC3: Beat 3's project curve has its mean at 15.2 on the same axis as the rows and the 13-day shade reads 13%.
- [x] AC4: In beat 4 the confidence control sets the deadline to 15.2 / 16.8 / 17.7 / 18.4 for 50 / 80 / 90 / 95% and the deadline slider updates the probability readout live.
- [x] AC5: In beat 5 setting the pessimistic estimate to 20 shows expected 16.5 and P(≤17) 56%; Reset restores 15.2 and 83%.
- [x] AC6: The deadline line is draggable with the pointer and movable with arrow keys; the scene `aria-label` reports mean, sigma and the current probability.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
