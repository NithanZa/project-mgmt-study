# PM Methods Interactive Course

## Outcome

Lesson 8, Resource-Constrained Project Scheduling, is complete at
`/learn/rcpsp`. The learner schedules a game jam with two programmers and one
artist, sees that ignoring people gives 13 days, that sensible priority rules
give 22 to 28, and that searching every order finds 20. Insight: with limited
resources the schedule is a search problem; rules are quick guesses, and the
exact answer needs search.

Scenario (days). Capacities: programmers 2, artist 1. Verified with a scratch
serial schedule generator and an exhaustive sweep over all 5040 priority
orders.

| id | task         | days | after | needs                 |
| -- | ------------ | ---- | ----- | --------------------- |
| A  | Concept art  | 5    |       | artist                |
| B  | Engine setup | 3    |       | 2 programmers         |
| C  | Style guide  | 2    |       | artist                |
| D  | Level 1      | 5    | C     | programmer + artist   |
| E  | Level 2      | 4    | C, D  | programmer + artist   |
| F  | Multiplayer  | 6    | B, D  | 2 programmers         |
| G  | Boss fight   | 6    | D     | programmer            |

CPM without resources: 13. Rules: min latest-start 22, most successors 22,
longest first 24, greatest demand 24, shortest first 28, input order 28.
Exhaustive optimum 20 (for example priority order F B C D E A G); worst order
28.

## Step-by-step

1. **Engine** `src/engine/rcpsp/`:
   - `types.ts`: `Resource = "programmer" | "artist"`,
     `Task { id; name; days; deps; needs: Partial<Record<Resource, number>> }`,
     `Capacities`, `Schedule`, `Rule = "min-lst" | "most-successors" | "longest" | "greatest-demand" | "shortest" | "input-order"`.
   - `fixture.ts`: `GAME_JAM: Task[]`, `CAPACITIES = { programmer: 2, artist: 1 }`.
   - `cpm.ts`: forward and backward pass (for the lower bound and LST).
   - `sgs.ts`: `serialSgs(tasks, capacities, priority: (a, b) => number): Schedule`
     (eligible = all predecessors finished; pick by priority; start at the
     first day where every needed unit is free for the whole duration),
     `ruleComparator(rule, tasks)`, `makespan(schedule)`.
   - `search.ts`: `exhaustive(tasks, capacities): { best: { makespan; order }; worst; histogram: Record<makespan, count>; evaluated: number }`
     over all permutations (Heap's algorithm; 5040 for seven tasks), memoised
     by a key of capacities. Must finish under 150 ms in Node.
     `sampleOrders(tasks, capacities, n, seed)` returns n random orders with
     their makespans for the animation.
   - `rcpsp.test.ts`: CPM 13; the six rule makespans; `exhaustive` best 20,
     worst 28, `evaluated` 5040; a schedule never exceeds capacity on any day
     (assert over the profile); runtime bound.

2. **Scene** `src/scenes/rcpsp/`:
   - `gantt.tsx`: seven rows, 0 to 30-day axis, bars animated with `layout`.
   - `lanes.tsx`: programmer lane (capacity 2) and artist lane (capacity 1)
     with hatched overloads (only the CPM schedule has any).
   - `distribution.tsx`: a strip chart of makespans across all orders
     (x from 13 to 30): bars for the histogram, markers for each rule, the
     optimum and the CPM lower bound; a best-so-far line during the search.
   - `scene.tsx`: state `{ mode: "cpm" | "rule" | "optimum", rule, capacities }`;
     readouts "Days", "Orders evaluated". Controls: rule `Segmented`
     (beats 3 and 5), Search button (beat 4), capacity controls programmers
     1 to 3 and artist 1 to 2 (beat 5), Reset. The search animation shows 40
     sampled orders at 40 ms each with the Gantt re-laying out, then jumps to
     the memoised optimum and fills the histogram.
   - `thumbnail.tsx`: static distribution strip with the markers.

3. **Beats** in `src/content/lessons/rcpsp.tsx`:
   1. *Ignore people and it is 13 days.* CPM Gantt; the programmer lane shows
      demand of 4 against capacity 2.
   2. *A sensible rule gives 22.* Min latest-start schedule animates in; lanes
      within capacity.
   3. *Different rules, different answers.* The rule control moves the Gantt
      between 22 and 28; markers appear on the strip.
   4. *The exact answer needs search: 20 days.* Search animates orders and the
      best-so-far line drops to 20; the lower bound sits at 13.
   5. *Try it: more people, different rules.* Capacity controls re-run rules
      and search; a line of copy notes that real projects use branch-and-bound
      or constraint solvers because orders grow factorially.
   Check: "Under resource limits the CPM duration is…" options the exact
   answer / a lower bound / an upper bound, answer lower bound, why: adding
   constraints can only lengthen a schedule.

4. **Register**, verify in the browser (search stays responsive; the Gantt
   re-layout during the search animation is smooth at 40 ms per order; the
   histogram fills in one layout animation), commit (`feat(lesson): rcpsp`),
   push.

## Acceptance criteria

- [ ] AC1: Engine tests pass: CPM 13, rule makespans 22 / 22 / 24 / 24 / 28 / 28 in the order listed, exhaustive best 20 and worst 28 over 5040 orders, under 150 ms.
- [ ] AC2: Beat 1 shows hatched programmer overload; beat 2 shows none and reads 22.
- [ ] AC3: Beat 3's rule control changes the Gantt and the strip marker for every rule with the verified values.
- [ ] AC4: Beat 4's search animation ends at 20 with a visible lower-bound line at 13 and an "Orders evaluated: 5040" readout.
- [ ] AC5: Beat 5 capacity changes recompute all rules and the optimum without blocking input (search runs in `startTransition`).
- [ ] AC6: Scene `aria-label` reports mode, rule and days; the lesson meets the phase 1 quality bar.
- [ ] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
