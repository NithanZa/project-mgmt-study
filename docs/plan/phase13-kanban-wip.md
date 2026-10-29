# PM Methods Interactive Course

## Outcome

Lesson 12, Kanban and WIP limits, is complete at `/learn/kanban`. The learner
watches a product team's board drown under push, sets work-in-progress limits,
sees cycle time fall while throughput stays, reads Little's law off a
cumulative flow diagram, and finds the limit that is tight but not starving.
Insight: starting less work makes work finish sooner, and the relationship is
arithmetic: cycle time = WIP ÷ throughput.

Scenario (per day, 60 days). Columns Analyse 3, Build 2, Test 3, Deploy 4;
four requests arrive per day. Verified with the shared line simulator:

| configuration                | throughput | cycle time | avg WIP | note                          |
| ---------------------------- | ---------- | ---------- | ------- | ----------------------------- |
| push                         | 2.0        | 19.5 and rising | 79 | Analyse and Build queues 63 / 61 at day 60 |
| WIP limit 1 per column       | 1.0        | 4.0        | 4       | too tight, Build starves      |
| WIP limit 2                  | 2.0        | 4.0        | 8       | the floor: one day per column |
| WIP limit 3                  | 2.0        | 5.0        | 10      | Little's law 10 ÷ 2 = 5       |
| WIP limit 4                  | 2.0        | 6.0        | 12      |                               |
| WIP limit 8                  | 2.0        | 9.8        | 20      |                               |
| WIP 3, Test down days 20–25  | 1.82       | 5.5        | 9.9     | upstream columns fill and stop |
| WIP 2, variability 0.5       | 1.78       | 4.3        | 7.6     | tight limits starve under noise |
| WIP 3, variability 0.5       | 1.98       | 5.0        | 10      | the practical sweet spot      |
| WIP 4, variability 0.5       | 2.02       | 6.0        | 12      |                               |

## Step-by-step

1. **Engine** `src/engine/kanban/`: `fixture.ts` (`BOARD` columns,
   `REQUESTS = 4`, `DAYS = 60`), `config.ts` (`push()`, `limited(wipLimit, variability?, outage?)`),
   `littles.ts` (`cycleTimeFromLittle(wip, throughput)`),
   `sweep.ts` (`limitSweep(variability, seeds = 8)` for limits 1 to 12),
   `kanban.test.ts` asserting the table (±0.1 throughput, ±0.5 cycle time,
   ±1 WIP) and that `avgWip / throughput` is within 10% of `avgCycleTime` for
   every limited run after warm-up.

2. **Scene** `src/scenes/kanban/`:
   - `board.tsx`: four columns with a header (name, capacity per day, and a
     WIP-limit chip that turns `constraint` when the column is full); cards
     are `motion.div` with `layoutId={`card-${id}`}` so a card visibly moves
     between columns; up to 10 cards shown per column plus a `+n` badge; a
     column that is blocked (downstream full) shows a "waiting" stripe.
   - `cfd.tsx`: cumulative flow diagram with one band per column
     (`motion.path` on `d`), a vertical bracket labelled WIP and a horizontal
     bracket labelled cycle time at the current tick, and the formula line
     `WIP ÷ throughput = cycle time` with live numbers.
   - `sweep-chart.tsx`: cycle time and throughput against WIP limit, with the
     variability toggle changing the curves.
   - `scene.tsx`: simulation in `useMemo`; playback as in the TOC lesson.
     Readouts: "WIP", "Throughput", "Cycle time". Controls: WIP limit slider
     1 to 12 (beats 2, 3, 5), "Test down for 5 days" button (beat 4),
     variability toggle (beat 5), Reset.
   - `thumbnail.tsx`: static board with limit chips.

3. **Beats** in `src/content/lessons/kanban.tsx`:
   1. *Push: everything starts, little finishes.* Playback; cards pile in
      Analyse and Build; WIP passes 100; cycle time keeps rising.
   2. *Limit WIP and cycle time falls; throughput does not.* Limit 3: WIP 10,
      throughput 2, cycle time 5.
   3. *Little's law: cycle time = WIP ÷ throughput.* The CFD appears for the
      limited run; brackets label the gaps; 10 ÷ 2 = 5.
   4. *A blocked column stops the ones before it, so problems surface.* Test
      down for five days: Build and Analyse fill to their limits and stop
      pulling; throughput dips to 1.8 and recovers.
   5. *Try it: tight, but not starving.* The sweep chart: at limit 1 throughput
      halves; at 2 cycle time hits the 4-day floor in a perfect world; with
      variability on, 2 starves (1.78) and 3 is the sweet spot.
   Check: "Throughput stays at 2 per day and WIP halves. Cycle time…" options
   halves / stays / doubles, answer halves, why: Little's law.

4. **Register**, verify in the browser (cards move between columns with a
   single layout animation; the CFD brackets track the current tick; the
   outage button animates the limit chips to `constraint`), commit
   (`feat(lesson): kanban and wip limits`), push.

## Acceptance criteria

- [x] AC1: `kanban.test.ts` passes for the table and the Little's law check.
- [x] AC2: Beat 1 shows WIP over 100 by day 60 and a rising cycle-time readout; beat 2 shows WIP 10, throughput 2, cycle time 5.
- [x] AC3: Beat 3's CFD brackets read WIP 10 and cycle time 5 at the final tick and the formula line shows the same numbers.
- [x] AC4: Beat 4's outage fills Build and Analyse to their limits, shows the waiting stripe, and the throughput readout dips below 1.9 before recovering.
- [x] AC5: Beat 5's sweep chart shows throughput 1 at limit 1 and, with variability on, throughput below 1.85 at limit 2 and above 1.95 at limit 3.
- [x] AC6: Scene `aria-label` reports the limit, WIP, throughput and cycle time; the lesson meets the phase 1 quality bar.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
