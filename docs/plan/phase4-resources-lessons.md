# PM Methods Interactive Course

## Outcome

Resource-aware scheduling engines (resource profiles, serial schedule
generation with priority rules, exhaustive optimum, critical chain with buffers)
exist and are tested, and lessons 7 to 9 (Resource Leveling, RCPSP, Critical
Chain) are complete on the same Launch project and Gantt component.

## Step-by-step

1. **Schedule type and resource profile** `src/engine/resources.ts`:
   `Schedule = Record<TaskId, { start: number; end: number }>`,
   `scheduleFromCpm(cpm)` (ES/EF), `makespan(schedule)`,
   `resourceProfile(project, schedule): Record<ResourceId, number[]>` (units
   in use per day), `overloads(profile, capacities): { resource, day, used }[]`.

2. **Serial schedule generation** `src/engine/scheduling.ts`:
   `PriorityRule = "min-lst" | "shortest" | "longest" | "input-order"`,
   `serialSgs(project, capacities, rule): Schedule` (eligible = all deps done;
   pick by rule; start at the earliest day where every needed resource has
   spare capacity for the whole duration). `optimalSchedule(project, capacities)`
   enumerates all priority permutations through `serialSgs` (8! = 40 320,
   under 1 s in Node; memoise per capacity set) and returns the best makespan
   and order. Fixture results to assert (verified):

   | capacities           | min-lst | shortest | longest | input-order | optimum |
   | -------------------- | ------- | -------- | ------- | ----------- | ------- |
   | all 1                | 24      | 27       | 24      | 24          | 24      |
   | dev 2, others 1      | 19      | 22       | 19      | 19          | 19      |

   The "shortest first" rule schedules Content (3 days, needs the designer)
   before Design (4 days, needs the designer) and slides the whole project.

3. **Leveling helpers** in `src/engine/scheduling.ts`: `levelWithinFloat(project, capacities)`
   tries to remove overloads by delaying non-critical tasks inside their float
   only; returns `{ schedule, resolved: boolean }` (for the fixture it cannot
   resolve the developer clash, which motivates extending the end date).

4. **Critical chain** `src/engine/critical-chain.ts`: the fixture durations are
   treated as "safe" (90%) estimates. `aggressive(d) = max(1, round(d * 0.6))`.
   `criticalChain(project, capacities)` builds the resource-feasible schedule
   with `serialSgs(min-lst)` on aggressive durations, then returns
   `{ chain: TaskId[] (the longest resource- and dependency-constrained path),
      schedule, projectBuffer, feedingBuffers: { before: TaskId; from: TaskId[]; days }[] }`
   with `projectBuffer = ceil(0.5 * sum of safety removed along the chain)` and
   one feeding buffer where a non-chain path (E) joins the chain (before G),
   sized at half the safety removed on that path. Fixture: the chain contains D
   (A B C D F G H) even though D is not on the critical path.
   `feverPoint(progress: Record<TaskId, number>)` returns
   `{ chainComplete: 0..1, bufferUsed: 0..1, zone: "green" | "yellow" | "red" }`
   where overruns beyond aggressive durations consume the buffer; zones split at
   one third and two thirds of the buffer, scaled by chain completion.

5. **Gantt additions** in `src/components/viz/gantt.tsx`: `lanes` renders one
   resource histogram row per resource under the bars with a capacity line and
   `constraint`-coloured overload days; `buffers` renders `buffer`-coloured
   blocks after the chain (project buffer) and before a join (feeding buffer).

6. **Fever chart** `src/components/viz/fever-chart.tsx`: x = chain complete,
   y = buffer used, three zone bands, a `motion.circle` point that springs to
   `feverPoint`, and a trail of previous points.

7. **Lessons** under `src/content/lessons/`:

   **7 · Resource Leveling** (`resource-leveling.tsx`, scene `LevelingScene`)
   1. *The critical path assumes infinite people.* Gantt with the `dev` lane:
      days 7 to 12 need two developers, capacity one, overload in `constraint`.
   2. *Shift inside float first.* Button "level within float": D slides one
      day; the overload remains (`resolved: false`), readout still 19.
   3. *When float runs out, the end date moves.* Button "level": schedule
      switches to `serialSgs(min-lst)`; D follows C; readout 24. The designer
      lane shows E waiting for B as well.
   4. *Try it.* Segmented control "developers: 1 / 2", "designers: 1 / 2";
      the lane and readout update (2 developers → 19).
   Check: "With two developers and one designer, the leveled duration is?"
   19 / 22 / 24, answer 19.

   **8 · RCPSP** (`rcpsp.tsx`, scene `RcpspScene`)
   1. *Order matters once people are scarce.* Gantt from `serialSgs(min-lst)`,
      readout 24.
   2. *A reasonable rule can be three days worse.* Segmented control for the
      rule: shortest-first shows 27 and highlights E taking the designer before
      B.
   3. *The exact answer is a search.* Button "search all orders" animates
      through sampled permutations (show 30 at 50 ms each, then jump to the
      memoised optimum) with the running best in a readout; optimum 24.
   4. *Try it.* Rule control plus capacity controls; the table of makespans per
      rule updates; a note says real projects need heuristics or solvers.
   Check: "Why does shortest-first lose here?" answer: it hands the designer to
   a task with nine days of float before a task with none.

   **9 · Critical Chain** (`critical-chain.tsx`, scene `CriticalChainScene`)
   1. *Everyone pads their estimate, and the padding gets used anyway.* Gantt of
      safe durations; a toggle shows the aggressive bars inside each safe bar.
   2. *The chain follows the people, not just the arrows.* Resource-feasible
      schedule; the chain A B C D F G H lights up with D included; a caption
      contrasts it with the critical path.
   3. *Cut the padding, pool it into buffers.* Bars shrink to aggressive
      durations; a project buffer appears after H and a feeding buffer before G;
      readout "chain 15 days + buffer" (use computed values).
   4. *Watch the buffer, not the tasks.* Fever chart. Sliders "overrun on C" and
      "overrun on D" (0 to 4 days) move the point across zones.
   Check: "Where does a feeding buffer go?" answer: where a non-chain path
   joins the chain.

8. **Register** lessons 7 to 9 in `src/content/lessons/index.ts`.

9. **Tests**: `resources.test.ts` (profile for CPM schedule shows dev = 2 on
   days 7 to 11), `scheduling.test.ts` (the table in step 2, `optimalSchedule`
   runtime under 1 s, `levelWithinFloat` returns `resolved: false` on the
   fixture), `critical-chain.test.ts` (chain contains D, buffers are positive
   integers, `feverPoint` with zero overrun is green at 0 buffer use).

10. Browser verification as in phase 3, then commit
    (`feat: lessons 7-9 and resource scheduling`) and push.

## Acceptance criteria

- [ ] AC1: `serialSgs(LAUNCH, allOne, "min-lst")` gives 24 and `"shortest"` gives 27; with two developers 19 and 22; `optimalSchedule` returns 24 and 19 respectively.
- [ ] AC2: `criticalChain(LAUNCH, allOne).chain` includes D and ends with H; the fever chart point moves to the red zone when both overrun sliders are at their maximum.
- [ ] AC3: Resource Leveling beat 1 shows an overload on the developer lane for days 7 to 12 and beat 3 shows a conflict-free lane with a 24-day readout.
- [ ] AC4: RCPSP beat 3 animates the search and lands on 24 without blocking input (the permutation sweep runs from memoised results, not during render).
- [ ] AC5: Critical Chain beat 3 renders a project buffer after H and a feeding buffer before G, in `buffer` colour, with sizes matching the engine output.
- [ ] AC6: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass, and `/learn/resource-leveling`, `/learn/rcpsp`, `/learn/critical-chain` work with keyboard beat navigation.
