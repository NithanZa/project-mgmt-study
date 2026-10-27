# PM Methods Interactive Course

## Outcome

Shared visualisation components for the task network exist, and lessons 1 to 6
(CPM, PERT, Monte Carlo, Fast Tracking, Crashing, DSM) are complete: real beats,
one morphing scene each, a "try it" beat with controls, and a check question.
The stub CPM lesson from phase 1 is replaced.

## Step-by-step

1. **Network diagram** `src/components/viz/network-diagram.tsx` (`"use client"`).
   Hybrid rendering: an absolutely positioned `motion.div` per task (so `layout`
   animations work) over an `<svg>` layer of `motion.path` edges whose `d`
   animates. Grid slots come from `task.pos` (6 columns, 3 rows). Props:
   `project`, `cpm: CpmResult`, `mode: "plain" | "forward" | "backward" | "full"`
   (which numbers to show: none, ES/EF, LS/LF + float, everything),
   `emphasis?: Record<TaskId, "critical" | "float" | "dim">`, `badges?:
   Record<TaskId, ReactNode>` (small label under a node, used for costs,
   estimates and criticality), `onSelect?(id)`, `selected?: TaskId`,
   `reveal?: number` (0..1 progress for the forward / backward pass ripple,
   animated by the caller with `animate()` on a motion value). Critical edges and
   nodes use `accent`, float uses `float`, dimmed uses `muted`; critical edges
   are also 2px thicker so colour is not the only channel.

2. **Gantt** `src/components/viz/gantt.tsx`: rows in fixture order, day scale
   across the top, bars from ES to EF positioned with percentage `left` /
   `width` and the `layout` prop so changes animate with transforms; float as a
   dashed ghost from EF to LF; optional `marker?: { day: number; label }`
   (deadline line) and `lanes?: ResourceId[]` (phase 4). Props mirror
   `network-diagram` (`project`, `schedule`, `emphasis`).

3. **Histogram** `src/components/viz/histogram.tsx`: vertical bars from
   `{ from, to, count }[]`, `markers` for P50 / P80 lines, `curve?` points for
   the PERT normal overlay, `height` animated with `layout` as counts grow.

4. **Matrix** `src/components/viz/matrix.tsx` for DSM: a CSS grid; row and
   column headers are `motion.div` with `layoutId` per task so reordering
   animates; cells are marks (`accent` below the diagonal, `constraint` above);
   `blocks` draw an outline around coupled blocks. Rows are draggable with
   `Reorder.Group` / `Reorder.Item`; arrow keys with focus on a header move it
   up or down (keyboard parity for drag).

5. **Scene scaffolding.** `src/components/lesson/scene-frame.tsx`: padding,
   a top-right readout strip (`Readout` components) and a bottom control strip
   (`Slider`, `Segmented`, `Button`) that only mounts on the beat that needs it
   (`AnimatePresence` with `height: "auto"`). Every scene is a client component
   holding its own state with `useState`; it derives everything else with
   `useMemo` from the phase 2 engines.

6. **Lesson modules.** One file per slug under `src/content/lessons/`, each
   exporting `lesson: Lesson` and a default component. Beat copy must be at most
   two sentences; the title is the takeaway, not a label. Specs:

   **1 · CPM** (`cpm.tsx`, scene `CpmScene`)
   1. *Eight tasks, one question: when do we launch?* Diagram, `mode: "plain"`.
   2. *Earliest start ripples forward.* `mode: "forward"`; a Play button animates
      `reveal` left to right in `order`; ES/EF numbers appear as reached.
   3. *Latest start ripples backward.* `mode: "backward"`, ripple right to left,
      float appears as LS − ES.
   4. *Zero float is the critical path.* `mode: "full"`, A B C F G H and their
      edges turn `accent`; readout "19 days"; D shows "1 day float", E "9".
   5. *Try it: shorten anything that is not critical and nothing happens.*
      Slider per selected task (click a node, then slide its duration 1 to 10);
      the path and the readout update; preset buttons "D → 7" (path jumps
      through D) and "E → 1" (no change).
   Check: "One task is a day late. Which one delays the launch?" options
   C / D / E, answer C, why: D still has one day of float, E has nine.

   **2 · PERT** (`pert.tsx`, scene `PertScene`)
   1. *A duration is a guess, so collect three.* Diagram with badges `o / m / p`.
   2. *Weight the likely case four times.* Badges morph to the expected value;
      a formula line shows `(o + 4m + p) / 6` with the numbers for C.
   3. *Spread adds up only along the critical path.* Gantt of the expected
      schedule; a normal curve (from `pertSummary`) sits on the time axis with
      the mean marker at 20.7 days and sigma 1.7.
   4. *Try it: pick a deadline and read the odds.* Slider "deadline" 17 to 26
      days moves a marker; readout "P(finish by) 79%" at 22; second slider
      "C pessimistic" 6 to 16 flattens the curve.
   Check: "o = 2, m = 4, p = 12. Expected?" options 4 / 5 / 6, answer 5.

   **3 · Monte Carlo** (`monte-carlo.tsx`, scene `MonteCarloScene`)
   1. *One run: roll every duration, recompute the path.* Diagram with
      sampled durations and a "Roll" button; the path flips through D sometimes.
   2. *Thousands of runs make a distribution.* Histogram fills in batches
      (10, 100, 500, 2000) with P50 and P80 markers; readout values count up.
   3. *Merge bias: simulation lands later than PERT.* Overlay the PERT normal
      curve; the mean sits right of 20.7 even though every task is sampled with
      the PERT mean. Criticality badges: D about 20%, E 0%.
   4. *Try it.* Sliders: runs (100 to 5000), "D pessimistic" (6 to 14); P80 and
      D's criticality move. Simulation runs inside `startTransition` from the
      engine; no worker needed (under 50 ms).
   Check: "Why is the simulated P50 later than the PERT expected value?"
   answer: several near-critical paths merge, and the longest sample wins.

   **4 · Fast Tracking** (`fast-tracking.tsx`, scene `FastTrackingScene`)
   1. *Build waits for Design to finish completely.* Gantt, B and C highlighted.
   2. *Start Build when Design is half done.* Overlap slider B → C (0 to 3)
      animates C's bar left; readout 19 → 17.
   3. *The price is rework risk.* A risk meter (`reworkRisk`) rises with the
      overlap; expected rework days shown; labelled "illustrative model".
   4. *Try it: overlapping a non-critical edge buys nothing.* Edge picker
      (B→C, B→D, E→G, F→G); E→G changes nothing, the readout stays 19.
   Check: "Fast-tracking D → F by 2 days shortens the project by?" 0 / 1 / 2,
   answer 0.

   **5 · Crashing** (`crashing.tsx`, scene `CrashingScene`)
   1. *Every task has a price per saved day.* Diagram with cost badges.
   2. *Buy the cheapest critical day.* "Crash a day" button runs `crashOnce`:
      C shrinks, readout 18 days / $400, a time-cost chart gains a point.
   3. *Then two paths go critical and days get dearer.* Second step highlights
      both paths; the step picks G at $700; the curve bends upward.
   4. *Try it: step, undo, and find the cheapest way to a deadline.* Buttons
      "Crash a day" / "Undo"; deadline slider 13 to 19 shows the cost from
      `crashCurve`; a "Crash E" button demonstrates wasted money (cost up,
      duration unchanged).
   Check: "After C reaches its crash limit, which single task is the cheapest
   next day?" options B / G / F, answer G.

   **6 · DSM** (`dsm.tsx`, scene `DsmScene`)
   1. *The same network, as a grid.* Nodes fly into row and column headers
      (`layoutId`), marks appear where a row depends on a column.
   2. *Feedback hides in a graph and jumps out in a matrix.* Toggle "QA
      findings revise Design" adds G → B: one mark above the diagonal in
      `constraint`.
   3. *Partition: reorder until feedback is boxed in.* "Partition" button
      animates rows and columns into the `partition` order; the block
      B C D F G gets an outline; E sits outside.
   4. *Try it: drag rows and count the feedback marks.* Reorder rows; readout
      "marks above the diagonal"; "Best" button restores the partition.
   Check: "A mark above the diagonal means?" answer: a task depends on one
   planned after it, so expect iteration.

7. **Register** the six lessons in `src/content/lessons/index.ts`; the other
   seven still map to the coming-soon component.

8. **Verify in the browser** (`pnpm dev`): walk every beat of all six lessons at
   1280px and 375px in light and dark schemes; check that scenes animate on beat
   change without flashing; use the DevTools performance panel on the Monte
   Carlo beat 2 and the DSM partition animation (no long tasks over 50 ms).

9. Commit (`feat: lessons 1-6 and network visualisations`) and push.

## Acceptance criteria

- [ ] AC1: `/learn/cpm`, `/learn/pert`, `/learn/monte-carlo`, `/learn/fast-tracking`, `/learn/crashing` and `/learn/dsm` each have 4 or 5 beats with copy of at most two sentences per beat and a working check card.
- [ ] AC2: In CPM beat 5, setting D to 7 moves the highlighted path through D and the readout shows 20; setting E to 1 leaves it at 19.
- [ ] AC3: PERT beat 4 shows 79% (±1) at a 22-day deadline with default estimates.
- [ ] AC4: Monte Carlo beat 2 reaches 2000 runs with the UI staying responsive (no input lag while the histogram fills) and the mean readout is above 20.7.
- [ ] AC5: Crashing beat 4 reproduces the engine sequence (18/$400, 17/$1100, 16/$2000, 15/$2900, 14/$4100, 13/$5600) and the Undo button walks back through it.
- [ ] AC6: DSM beat 4 lets the learner reorder rows by drag and by keyboard, the feedback count updates live, and "Best" returns to the partitioned order with the block outlined.
- [ ] AC7: Scenes never remount on beat change (each scene logs a single mount per visit) and all animations use transforms, opacity or `layout` (no `width` / `left` tweens outside `layout`).
- [ ] AC8: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
