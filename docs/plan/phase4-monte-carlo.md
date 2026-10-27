# PM Methods Interactive Course

## Outcome

Lesson 3, Monte Carlo Schedule Simulation, is complete at `/learn/monte-carlo`.
The learner plans a conference with parallel workstreams, rolls the project
thousands of times, and discovers merge bias: the more equal parallel paths
there are, the later the realistic finish, even though PERT's single-path sum
never changes. Insight: simulate the whole network instead of trusting one
estimate; parallel uncertainty compounds.

Scenario (days). `k` parallel workstreams (default 3: Venue, Speakers,
Marketing), each "Shortlist" 3 / 5 / 9 then "Confirm" 2 / 4 / 8, all feeding
"Event prep" 1 / 2 / 3. PERT expected per stream 9.67, total 11.67 for any `k`.
Sampling uses beta-PERT (sample means equal the PERT expected values).
Verified with 4000 runs, seed 7:

| streams k | mean  | P50   | P80   | P90   | criticality per stream |
| --------- | ----- | ----- | ----- | ----- | ---------------------- |
| 1         | 11.66 | 11.61 | 13.03 | 13.77 | 100%                   |
| 2         | 12.58 | 12.54 | 13.74 | 14.48 | 50%                    |
| 3         | 13.03 | 13.00 | 14.10 | 14.75 | 33%                    |
| 4         | 13.36 | 13.33 | 14.39 | 15.01 | 25%                    |
| 6         | 13.74 | 13.71 | 14.71 | 15.23 | 17%                    |

Convergence (k = 3, P80 standard deviation across 20 seeds): 10 runs 0.40,
100 runs 0.19, 500 runs 0.07, 1000 runs 0.05, 2000 runs 0.04, 5000 runs 0.02.
5000 runs take about 11 ms in Node.

## Step-by-step

1. **Engine** `src/engine/monte-carlo/`:
   - `types.ts`: `Stream { id; name; shortlist: Estimate; confirm: Estimate }`,
     `Config { streams: number; runs: number; seed: number; rush?: boolean }`
     (`rush` sets Speakers' Confirm to 3 / 6 / 12).
   - `fixture.ts`: stream names for k up to 6 (Venue, Speakers, Marketing,
     Sponsors, Catering, Travel) and the estimates.
   - `simulate.ts`: `simulate(config): { durations: Float64Array; mean; p50; p80; p90; histogram: { from; to; count }[]; criticality: number[]; sample(run): per-task values }`
     using `betaPert` from `src/lib/random.ts`; bins are 0.5 days wide.
     `pertTotal(config)` returns 11.67 (or the rush value).
     `convergence(config, runsList, seeds = 20)` returns the P80 spread per run
     count; memoise by config.
   - `simulate.test.ts`: same seed gives identical arrays; sample mean of a
     single Shortlist task 5.33 ±0.05 over 5000 draws; the table above within
     ±0.1 for mean and P50 at k = 1, 3, 6; criticality sums to 1; convergence
     spread at 5000 runs is below 0.05; 5000 runs finish under 100 ms.

2. **Scene** `src/scenes/monte-carlo/`:
   - `stream-network.tsx`: a start node, `k` rows of two task boxes, and the
     Event prep node, laid out with `layout` so changing `k` animates rows in
     and out (`AnimatePresence`). Each box shows its three-point estimate and,
     after a roll, the sampled value; the longest row lights in `accent`.
   - `histogram.tsx`: bars grow with `layout`; markers for PERT total (`float`
     colour, dashed), P50 and P80 (`accent`), and the current roll (a dot that
     drops onto the axis).
   - `criticality-bars.tsx`: one bar per stream with its criticality share.
   - `convergence-band.tsx`: P80 estimate ±1 sd band versus run count on a log
     axis, with the current run count highlighted.
   - `scene.tsx`: state `{ k, runs, seed, rush }`; simulation in
     `startTransition` inside `useMemo` keyed by config; a Roll button samples
     one run and animates it into the histogram. Readouts: "PERT 11.7 d",
     "P50", "P80", "Runs". Controls: Roll (beat 1), Run batches 10 / 100 / 1000
     / 5000 (beat 2), streams slider 1 to 6 (beat 3), rush toggle (beat 4),
     runs slider 10 to 5000 on a log scale (beat 5), Reset.
   - `thumbnail.tsx`: static histogram with P50 and PERT markers.

3. **Beats** in `src/content/lessons/monte-carlo.tsx`:
   1. *One roll: every task draws from its curve.* Roll; the longest stream
      lights; the finish lands on the axis.
   2. *Thousands of rolls become a distribution.* Batches fill the histogram;
      P50 and P80 appear; mean readout counts up.
   3. *Parallel paths push the finish past PERT.* PERT marker stays at 11.7
      while the streams slider moves P50 from 11.6 (one stream) to 13.7 (six).
   4. *Criticality: who is the bottleneck this time?* Bars at about 33% each;
      the rush toggle pushes Speakers' share up and the others down.
   5. *Try it: how many runs are enough?* The convergence band narrows from
      ±0.4 days at 10 runs to ±0.02 at 5000; commit at P80.
   Check: "PERT says 11.7 days. Three equal parallel streams. The simulated
   median is…" options earlier / the same / later, answer later, why: the
   finish is the maximum of three uncertain paths.

4. **Register**, verify in the browser (histogram fill stays responsive while
   dragging the streams slider; no frame over 50 ms in the performance panel),
   commit (`feat(lesson): monte carlo`), push.

## Acceptance criteria

- [ ] AC1: `simulate({ streams: 3, runs: 4000, seed: 7 })` returns mean 13.03 ±0.1 and P50 13.0 ±0.1; with `streams: 1` P50 is 11.6 ±0.1.
- [ ] AC2: Beat 3's streams slider changes the network row count with animation and moves the P50 marker monotonically to the right from 1 to 6 streams while the PERT marker stays at 11.7.
- [ ] AC3: Beat 4 shows criticality bars that sum to 100% and the rush toggle gives Speakers the largest share.
- [ ] AC4: Beat 5's convergence band width at 5000 runs is under 0.1 days and at 10 runs over 0.5 days.
- [ ] AC5: Rolling in beat 1 animates one dot onto the axis and updates the sampled values on the boxes without re-running the full simulation.
- [ ] AC6: Scene `aria-label` reports streams, runs, P50 and P80; all controls work by keyboard.
- [ ] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
