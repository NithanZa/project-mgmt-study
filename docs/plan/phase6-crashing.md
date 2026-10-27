# PM Methods Interactive Course

## Outcome

Lesson 5, Project Crashing, is complete at `/learn/crashing`. The learner
shortens a trade show booth project one day at a time, always buying the
cheapest critical day, watches a second path turn critical, and stops where a
day costs more than the overhead it saves. Insight: put money where it buys the
most schedule per dollar, and stop when marginal cost exceeds marginal benefit.

Scenario (days). Verified: duration 15, critical A B D E, Graphics float 1.

| id | task      | days | after | crash limit | cost per day |
| -- | --------- | ---- | ----- | ----------- | ------------ |
| A  | Design    | 4    |       | 2           | $600         |
| B  | Fabricate | 6    | A     | 4           | $400         |
| C  | Graphics  | 5    | A     | 3           | $900         |
| D  | Ship      | 3    | B, C  | 1           | $1500        |
| E  | Set up    | 2    | D     | 2 (fixed)   |              |

Cheapest-first sequence (verified): B $400 → 14 (now A B D E and A C D E are
both critical), A $600 → 13, A $600 → 12, B + C $1300 → 11, D $1500 → 10,
D $1500 → 9, then nothing. Cumulative direct cost 400, 1000, 1600, 2900, 4400,
5900. With overhead per day the cheapest total (direct + overhead × days) is
at 15 days for $300, 14 for $500, 12 for $800 and $1000, 11 for $1400, 9 for
$2000.

## Step-by-step

1. **Engine** `src/engine/crashing/`:
   - `types.ts`: `CrashTask { id; name; days; deps; minDays; costPerDay; pos }`.
   - `fixture.ts`: `BOOTH: CrashTask[]`, `DEFAULT_OVERHEAD = 800`.
   - `cpm.ts`: a small forward/backward pass returning duration, floats and
     all critical paths (this lesson's own, kept to what it needs).
   - `crash.ts`: `crashOnce(tasks): { tasks; crashed: string[]; cost } | null`
     evaluates every critical task and every pair of critical tasks that can
     still be crashed, keeps those that reduce the duration by exactly one day,
     and picks the cheapest (ties: fewer tasks, then input order).
     `crashCurve(tasks): { days; direct; step: { crashed; cost } | null }[]`,
     `totalCostCurve(curve, overhead): { days; direct; overhead; total }[]`,
     `optimum(curve, overhead): { days; total }`.
   - `crash.test.ts`: the sequence and cumulative costs; `optimum` for the six
     overhead values; crashing stops at 9; Graphics is never crashed alone.

2. **Scene** `src/scenes/crashing/`:
   - `network.tsx`: five nodes (A at col 0, B and C at col 1, D at col 2, E at
     col 3) with a badge "cost/day · min" under each; critical paths in
     `accent`; the node most recently crashed flashes once; a node at its crash
     limit shows a lock glyph.
   - `cost-chart.tsx`: x from 9 to 15 days, y in dollars; direct-cost points
     joined by a `motion.path`, the overhead line, and the total-cost curve
     with an optimum dot that springs to the new minimum when overhead changes.
   - `scene.tsx`: state `{ history: tasks[] }` (crash pushes, undo pops),
     `overhead`. Readouts: "Days", "Direct cost", "Total cost". Controls:
     Crash a day, Undo (beats 2 to 5), overhead slider 300 to 2000 step 100
     (beats 4 and 5), "Crash Graphics" demonstration button (beat 5), Reset.
   - `thumbnail.tsx`: static cost chart with the U-shaped total.

3. **Beats** in `src/content/lessons/crashing.tsx`:
   1. *Every task has a price for going faster.* Badges; A B D E lit.
   2. *Buy the cheapest critical day.* Crash once: Fabricate, $400, 14 days;
      the chart gets its first point.
   3. *Two paths go critical; now a shared task is cheapest.* The network shows
      both paths lit; the next crash picks Design at $600 rather than
      Fabricate plus Graphics at $1300.
   4. *Stop when a day costs more than it saves.* The overhead line and total
      curve appear; at $800 per day the minimum is 12 days.
   5. *Try it: crash, undo, move the overhead.* Overhead at $500 stops at 14;
      at $2000 it pays to go all the way to 9. The Graphics button shows money
      spent with no change in days.
   Check: "Overhead is $800 per day and the next crash step costs $1300. Take
   it?" options Yes / No, answer No, why: the day saved is worth $800.

4. **Register**, verify in the browser (the optimum dot moves as the slider
   moves, undo walks back through the exact sequence), commit
   (`feat(lesson): crashing`), push.

## Acceptance criteria

- [ ] AC1: `crashCurve(BOOTH)` yields days 15 → 9 with cumulative direct costs 0, 400, 1000, 1600, 2900, 4400, 5900 and the crashed sets B, A, A, B+C, D, D.
- [ ] AC2: `optimum` returns 15 / 14 / 12 / 12 / 11 / 9 days for overhead 300 / 500 / 800 / 1000 / 1400 / 2000.
- [ ] AC3: After the first crash in beat 2 both critical paths render in `accent`; the second crash highlights Design.
- [ ] AC4: Beat 4's total-cost curve shows its minimum at 12 days with the default overhead; moving the slider to 2000 moves the dot to 9.
- [ ] AC5: Undo restores the previous network, readouts and chart point; the Graphics button changes the direct cost but not the days.
- [ ] AC6: Scene `aria-label` reports days, direct cost and the current optimum; the lesson meets the phase 1 quality bar.
- [ ] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
