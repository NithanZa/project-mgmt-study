# PM Methods Interactive Course

## Outcome

Pure TypeScript engines for every network-based method (CPM, PERT, Monte Carlo,
fast tracking, crashing, DSM) live under `src/engine/`, run against the shared
Launch project fixture, and are unit tested with known values. No React in this
phase. Scenes in phase 3 only render what these functions return.

## Step-by-step

1. **Types** in `src/engine/types.ts`:
   ```ts
   export type TaskId = string;
   export type ResourceId = "pm" | "design" | "dev" | "writer" | "qa";
   export interface Estimate { o: number; m: number; p: number }           // optimistic, most likely, pessimistic (days)
   export interface Crash { minDuration: number; costPerDay: number }     // crashing limits
   export interface Task {
     id: TaskId; name: string; duration: number; deps: TaskId[];
     needs: Partial<Record<ResourceId, number>>;                          // resource units while running
     estimate: Estimate; crash: Crash;
     pos: { col: number; row: number };                                   // network diagram grid slot
   }
   export interface Overlap { from: TaskId; to: TaskId; days: number }     // fast tracking lead
   export interface Project { tasks: Task[]; overlaps?: Overlap[] }
   ```
   Tasks are stored in topological order in the fixture; engines must not rely
   on that and must compute their own order (Kahn's algorithm) and throw
   `CycleError` on a cycle.

2. **Fixture** `src/engine/fixtures/launch.ts` exporting `LAUNCH: Project`,
   `RESOURCES: Record<ResourceId, { name: string; capacity: number }>` (all
   capacity 1) and `LAUNCH_FEEDBACK = { from: "G", to: "B" }` (an edge used only
   by DSM: QA findings revise the design). Values (verified by hand):

   | id | name           | dur | deps | needs              | o/m/p  | crash min / $ per day | pos (col,row) |
   | -- | -------------- | --- | ---- | ------------------ | ------ | --------------------- | ------------- |
   | A  | Scope          | 3   |      | pm 1               | 2/3/5  | 2 / 1500              | 0,1           |
   | B  | Design         | 4   | A    | design 1           | 3/4/7  | 3 / 900               | 1,0           |
   | C  | Build backend  | 6   | B    | dev 1              | 4/6/11 | 4 / 400               | 2,0           |
   | D  | Build frontend | 5   | B    | dev 1, design 1    | 3/5/9  | 3 / 500               | 2,1           |
   | E  | Content        | 3   | A    | writer 1, design 1 | 2/3/5  | 2 / 300               | 1,2           |
   | F  | Integrate      | 2   | C, D | dev 1              | 1/2/4  | 1 / 1200              | 3,1           |
   | G  | QA             | 3   | F, E | qa 1               | 2/3/6  | 2 / 700               | 4,1           |
   | H  | Launch         | 1   | G    | pm 1               | 1/1/2  | 1 / 0 (not crashable) | 5,1           |

   Known results used by tests and by lesson copy: duration **19**, critical
   path **A B C F G H**, float D = 1, E = 9, all others 0. With one unit of each
   resource the resource-feasible makespan is **24**; with two developers it is
   **19** (phase 4).

3. **CPM** `src/engine/cpm.ts`: `computeCpm(project): CpmResult` with
   `{ duration, order: TaskId[], criticalPath: TaskId[], tasks: Record<TaskId, { es, ef, ls, lf, float, critical }> }`.
   Forward pass `es = max(ef(dep) - overlap(dep -> task))`, backward pass
   `lf = min(ls(succ) + overlap(task -> succ))`, `critical = float === 0`.
   `criticalPath` walks from the start along zero-float tasks to the end; when
   two parallel paths are critical return every critical task in `order`.
   Export `withDuration(project, id, duration)` and
   `withOverlap(project, from, to, days)` as immutable helpers.

4. **PERT** `src/engine/pert.ts`: `expected(e) = (o + 4m + p) / 6`,
   `variance(e) = ((p - o) / 6) ** 2`, `toPertProject(project)` (durations
   replaced by expected values, unrounded), `pertSummary(project)` returning
   `{ expected, sigma, criticalPath, probabilityBy(days): number }` using the
   normal CDF (Abramowitz-Stegun approximation, error < 1e-5) over the sum of
   critical-path variances. Fixture values: expected ≈ 20.67, sigma ≈ 1.667,
   `probabilityBy(22) ≈ 0.788`.

5. **Monte Carlo** `src/engine/monte-carlo.ts`: `mulberry32(seed)` PRNG,
   `sampleBetaPert(e, rng)` (beta-PERT: `alpha = 1 + 4(m - o)/(p - o)`,
   `beta = 1 + 4(p - m)/(p - o)`, sampled from two gamma draws with the
   Marsaglia-Tsang method, so the sampling mean equals the PERT expected value
   and the lesson's comparison with PERT isolates merge bias), and
   `simulate(project, { runs, seed }): { durations: Float64Array; p50; p80; p90; mean; criticality: Record<TaskId, number>; histogram: { from, to, count }[] }`.
   Each run samples every task, runs `computeCpm`, records the duration and
   which tasks were critical. Histogram bins are 1 day wide from `floor(min)`
   to `ceil(max)`. 2000 runs must finish under 50 ms in Node (assert with
   `performance.now()` in the test, with a loose 200 ms ceiling for CI).

6. **Fast tracking** `src/engine/fast-tracking.ts`: `overlapOptions(project)`
   lists dependency edges that can be overlapped (every edge, with
   `maxDays = min(from.duration - 1, to.duration - 1)`), and
   `reworkRisk(project, overlap): { probability: number; expectedReworkDays: number }`
   using the illustrative model `probability = days / from.duration`,
   `expectedReworkDays = probability * days * 0.5`. Label it illustrative in the
   UI; it exists to make the trade-off visible, not to be accurate.

7. **Crashing** `src/engine/crashing.ts`: `crashOnce(project): { project, cost, tasks: TaskId[] } | null`
   finds the cheapest set of critical tasks (singles, then pairs) whose
   one-day crash reduces `duration` by exactly one day, applying crash limits;
   ties go to fewer tasks, then lower input order. `crashCurve(project)` repeats
   until null and returns `{ duration, totalCost, step: { tasks, cost } | null }[]`.
   Fixture sequence (verified): C $400 → 18, G $700 → 17, B $900 → 16,
   C + D $900 → 15, F $1200 → 14, A $1500 → 13, then null. Marginal costs rise
   monotonically; the total at 13 days is $5600.

8. **DSM** `src/engine/dsm.ts`: `buildDsm(project, extraEdges: { from, to }[])`
   returns `{ ids, dependsOn: (row, col) => boolean }` (row depends on column).
   `feedbackCount(dsm, order)` counts marks above the diagonal for a given
   order. `partition(dsm)` runs Tarjan SCC, orders the condensation
   topologically, and returns `{ order: TaskId[]; blocks: TaskId[][] }` where
   each block with more than one task is a coupled iteration block. With the
   fixture plus feedback edge G → B the block is `{B, C, D, F, G}` and E stays
   outside it.

9. **Tests** (`*.test.ts` next to each file, Vitest):
   - `cpm`: duration 19, critical path order, floats of D and E, ES/EF/LS/LF
     table for all tasks, `withDuration(D, 7)` moves the path through D,
     `withOverlap(B, C, 2)` gives 17, a cyclic project throws `CycleError`.
   - `pert`: expected and variance for C (6.5, 1.361), summary values above,
     `probabilityBy(expected)` ≈ 0.5.
   - `monte-carlo`: the same seed gives identical output; E's criticality is 0;
     D's is between 0.1 and 0.4; the sample mean of C alone is 6.5 ±0.1 over
     2000 draws; `mean > 20.67` (merge bias makes the project later than the
     PERT expected value); runtime bound.
   - `fast-tracking`: `maxDays` for B → C is 3; risk is 0 at 0 days.
   - `crashing`: the exact sequence and totals above; a non-critical task never
     appears in a step.
   - `dsm`: zero feedback marks for the topological order without the
     feedback edge; exactly one with it; `partition` block membership.

10. Commit (`feat(engine): network methods`) and push.

## Acceptance criteria

- [ ] AC1: `pnpm test` passes with at least the test cases listed in step 9 and `pnpm typecheck` is clean; `src/engine/` imports nothing from React or Next.
- [ ] AC2: `computeCpm(LAUNCH)` returns duration 19, critical path `A,B,C,F,G,H`, float 1 for D and 9 for E.
- [ ] AC3: `crashCurve(LAUNCH)` returns durations 19 to 13 with cumulative costs 0, 400, 1100, 2000, 2900, 4100, 5600.
- [ ] AC4: `simulate(LAUNCH, { runs: 2000, seed: 1 })` is deterministic and runs under 200 ms in the test.
- [ ] AC5: `partition(buildDsm(LAUNCH, [{ from: "G", to: "B" }]))` yields one block containing exactly B, C, D, F, G.
- [ ] AC6: Every exported engine function is pure (no module state, inputs not mutated), verified by a test that deep-freezes `LAUNCH` before calling each function.
