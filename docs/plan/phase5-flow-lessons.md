# PM Methods Interactive Course

## Outcome

A discrete flow simulator and a value stream model exist and are tested, the
animated work-line and value-stream visualisations exist, and lessons 10 to 13
(Theory of Constraints, Drum-Buffer-Rope, Kanban and WIP limits, Value Stream
Mapping) are complete. All 13 lessons are now registered.

## Step-by-step

1. **Flow fixture** `src/engine/fixtures/line.ts`: four stations
   `Intake 5/day, Design 3/day, Build 2/day, Review 4/day`, arrivals 4 per day,
   horizon 60 days. Build is the constraint; the steady-state throughput is 2
   per day.

2. **Flow simulator** `src/engine/flow.ts`:
   ```ts
   interface Station { id: string; name: string; capacity: number }
   interface FlowConfig {
     stations: Station[]; arrivalsPerDay: number; days: number; seed: number;
     release: "push" | "drum";          // drum: the rope caps WIP at or before the constraint at bufferTarget
     bufferTarget?: number;             // drum only (required with "drum")
     wipLimit?: number;                 // per-station limit including items in work (Kanban pull)
     variability: number;               // 0..1 scales daily capacity noise
     outage?: { station: string; from: number; to: number };   // capacity 0 on [from, to)
   }
   interface DayState { day: number; queues: number[]; wip: number; exited: number }
   interface FlowResult {
     days: DayState[]; throughput: number; avgCycleTime: number; avgWip: number;
     utilization: number[]; bottleneck: string; cfd: { day: number; cumulativeIn: number; cumulativeOut: number[] }[];
     items: { id: number; enteredDay: number; exitedDay?: number; history: number[] }[];
   }
   simulateFlow(config): FlowResult
   ```
   Semantics (keep exactly these; the lesson numbers depend on them):
   - One day per step. A station processes at most `cap` items **that were in
     its queue at the start of the day**, so an item spends at least one day at
     each station and the floor cycle time is 4 days. Process stations
     downstream first so a slot freed today is not refilled today.
   - `cap = round(capacity * (1 + u))` with `u` uniform in `±variability` from
     `mulberry32(seed)`, drawn for every station every day (also when
     variability is 0, to keep seeds aligned); `outage` forces `cap = 0`.
   - Push: release `arrivalsPerDay` at the end of every day.
   - Pull (`wipLimit`): a station only moves an item downstream while the next
     station holds fewer than `wipLimit`; release at Intake obeys the same limit.
   - Drum: the constraint is the station with the smallest nominal capacity.
     Release at the end of the day `max(0, bufferTarget - wipAtOrBeforeConstraint)`,
     capped by `arrivalsPerDay`. The buffer is therefore the stock the rope
     keeps between Intake and the drum.
   - `utilization[i] = processed[i] / (capacity[i] * days)`.
     `throughput` and `avgCycleTime` use items that exited after a 10-day
     warm-up; `avgWip` averages `wip` after the warm-up. Cap `items` at 1 000.
   Expected fixture results (verified with a scratch model of these rules; the
   tests assert the ranges):

   | config                                   | throughput | cycle time | avg WIP | note                            |
   | ---------------------------------------- | ---------- | ---------- | ------- | ------------------------------- |
   | push, variability 0                      | 2.0        | about 19   | about 79 | Build queue 60 on day 60       |
   | push, Review capacity 8                  | 2.0        | about 19   | about 79 | nothing changes                |
   | push, Build capacity 3                   | 3.0        | about 12   | about 47 | Design becomes the bottleneck  |
   | wipLimit 1                               | 1.0        | 4.0        | 4       | too tight, the drum starves     |
   | wipLimit 2                               | 2.0        | 4.0        | 8       | the floor                       |
   | wipLimit 3                               | 2.0        | 5.5        | 11      |                                 |
   | wipLimit 6                               | 2.0        | about 10   | 20      |                                 |
   | drum, bufferTarget 8, variability 0      | 2.0        | 4.0        | 8       | same as wipLimit 2              |
   | drum, bufferTarget 6, variability 1.0    | about 1.5  | about 5.4  | about 8 | Build utilisation about 0.71 (8-seed mean) |
   | drum, bufferTarget 12, variability 1.0   | about 1.96 | about 7.7  | about 15 | Build utilisation about 0.93 (8-seed mean) |

3. **Value stream model** `src/engine/vsm.ts`:
   `VsmStep = { id; name; processHours: number; waitDaysBefore: number }`,
   fixture `VSM_STEPS`: Request 0.5h / wait 2d, Approve 0.25h / 3d,
   Design 8h / 1d, Build 16h / 2d, Review 2h / 4d, Deploy 0.5h / 0d.
   `vsmSummary(steps, hoursPerDay = 8): { leadTimeDays, processDays, efficiency }`
   (lead time = waits + process; efficiency = process / lead, about 0.22 here).
   `IMPROVEMENTS`: `{ id, label, apply(steps) }` for "pre-approved budgets"
   (Approve wait 3d → 0.25d), "daily review slot" (Review wait 4d → 0.5d),
   "request template" (Request wait 2d → 0.5d); `applyImprovements(steps, ids)`.

4. **Work line visualisation** `src/components/viz/flow-line.tsx`: four station
   columns; each shows up to 12 item chips plus a `+n` badge; chips are
   `motion.div` with `layoutId={`item-${id}`}` so an item visibly moves between
   columns; items leaving the last station exit through `AnimatePresence`.
   A capacity dial under each station, utilisation bar, and a queue count.
   Playback controls: play / pause, speed (1x, 4x), reset; the scene advances
   `day` on an interval (not per frame) and derives the visible state from
   `FlowResult.days[day]` (whole-run simulation is computed once per config in
   `useMemo`; the UI only scrubs it). Readouts: throughput, WIP, cycle time.

5. **Cumulative flow diagram** `src/components/viz/cfd.tsx`: stacked bands from
   `cfd`, animated with `motion.path` on `d`; the vertical gap is WIP and the
   horizontal gap is cycle time (labelled on hover / focus).

6. **Value stream ladder** `src/components/viz/vsm-ladder.tsx`: a horizontal
   timeline where process segments sit high (thin, `accent`) and waits sit low
   (thick, `constraint`), widths proportional to time with `layout` so toggling
   an improvement animates the whole ladder; totals at the right edge.

7. **Lessons** under `src/content/lessons/`:

   **10 · Theory of Constraints** (`toc.tsx`, scene `TocScene`)
   1. *Work piles up in front of the slowest step.* Play the push line; Build's
      queue grows; readout throughput 2 / day.
   2. *Speeding up anything else changes nothing.* Button "double Review";
      replay; throughput still 2.
   3. *Raise the constraint and the constraint moves.* Button "Build 2 → 3";
      throughput 3; Design is now the bottleneck (highlighted).
   4. *Five focusing steps.* A segmented control Identify / Exploit /
      Subordinate / Elevate / Repeat annotates the line (identify = highlight;
      exploit = variability 0 on Build; subordinate = release at Build's rate;
      elevate = capacity 3; repeat = next bottleneck).
   5. *Try it.* Capacity sliders for all four stations; readouts live.
   Check: "Doubling Review's capacity raises throughput by?" 0 / 1 / 2, answer 0.

   **11 · Drum-Buffer-Rope** (`dbr.tsx`, scene `DbrScene`)
   1. *Without a rope, the queue before Build grows forever.* Push replay;
      Build's queue reaches 60.
   2. *The drum sets the beat; the rope releases only what the drum consumed.*
      `release: "drum", bufferTarget: 8`; WIP flat at 8, cycle time 4, the
      readouts stop climbing.
   3. *A noisy feed starves the drum unless a buffer stands in front of it.*
      Variability 1.0 with `bufferTarget: 6`: Build's utilisation bar drops to
      about 0.7 and throughput to about 1.5; set `bufferTarget: 12`: utilisation
      about 0.93, throughput back near 2, at the price of more WIP.
   4. *Try it.* Sliders: variability 0 to 1, buffer target 4 to 16; readouts
      throughput, drum utilisation, WIP, cycle time. The learner finds the
      smallest buffer that keeps the drum fed.
   Check: "What does the rope control?" answer: when new work is released into
   the line, tied to what the drum has consumed.

   **12 · Kanban and WIP limits** (`kanban.tsx`, scene `KanbanScene`)
   1. *Push: everything starts, little finishes.* Push replay; WIP climbs past
      100; the cycle time readout climbs with it.
   2. *Limit WIP and cycle time falls while throughput stays.* `wipLimit: 3`;
      WIP 11, throughput 2, cycle time 5.5 days.
   3. *Little's law: cycle time = WIP ÷ throughput.* The CFD appears for the
      limited run; the vertical gap (WIP) and horizontal gap (cycle time) are
      labelled; a formula line shows `11 ÷ 2 = 5.5` live.
   4. *A blocked column stops the ones before it, so problems surface.* Button
      "Review down for 5 days" (`outage` on Review, days 20 to 25); the columns
      upstream fill to their limit and stop pulling; throughput dips to about
      1.8 and recovers.
   5. *Try it: find the limit that is tight but not starving.* WIP limit
      slider 1 to 12; at 1 throughput halves, at 2 cycle time hits the 4-day
      floor, above that cycle time grows with no throughput gain. CFD and
      readouts live.
   Check: "Throughput fixed at 2 / day, WIP halves. Cycle time?" answer halves.

   **13 · Value Stream Mapping** (`vsm.tsx`, scene `VsmScene`)
   1. *Most of the lead time is waiting.* Ladder with totals; readouts lead
      time, process time, efficiency 22%.
   2. *Name the waste.* Hover or focus a wait segment to read why it exists
      (approval queue, review batch, handoff).
   3. *Design the future state.* Toggles apply improvements; the ladder
      shrinks; lead time and efficiency animate.
   4. *Try it.* All three toggles plus a "process hours" slider on Build to show
      that speeding the work itself barely moves lead time.
   Check: "Process-cycle efficiency is?" answer process time ÷ lead time.

8. **Register** lessons 10 to 13 and delete `coming-soon.tsx` if no slug uses it.

9. **Tests**: `flow.test.ts` (determinism per seed, the three expected results
   from step 2, items conserved: `arrived = exited + wip` every day, runtime for
   60 days under 5 ms), `vsm.test.ts` (fixture summary values, improvements
   reduce lead time monotonically, no negative waits).

10. Browser verification as in phase 3; additionally check the flow line at 4x
    speed holds 60 fps in the performance panel (chips use transforms only).
    Commit (`feat: lessons 10-13 and flow simulation`) and push.

## Acceptance criteria

- [ ] AC1: `simulateFlow` on the push fixture reports throughput 2 ±0.1 and a Build queue of at least 50 on day 60; `wipLimit: 3` reports average WIP 11 ±1 and cycle time 5.5 ±0.5 with the same throughput; `wipLimit: 1` reports throughput 1 ±0.1.
- [ ] AC2: Drum with `variability: 1.0`, seed 1, `bufferTarget: 6` shows Build utilisation below 0.85; `bufferTarget: 12` shows at or above 0.88, and the test also asserts the 8-seed means land within ±0.05 of 0.71 and 0.93.
- [ ] AC3: Every lesson page from `/learn/toc` to `/learn/vsm` plays its simulation without dropping below 55 fps at 4x on a laptop (performance panel, 10-second sample).
- [ ] AC4: In Kanban beat 2 the readouts show WIP 11 (±1), throughput 2 and cycle time 5.5 (±0.5) days; beat 3's formula line shows the same numbers and the CFD's band gaps match them.
- [ ] AC5: VSM beat 1 shows lead time 15.4 days and efficiency 22% (±1); enabling all three improvements lowers lead time to 7.7 days (±0.1) and raises efficiency above 40%.
- [ ] AC6: All 13 slugs render a real lesson; `coming-soon.tsx` is gone; `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
