# PM Methods Interactive Course

## Outcome

Lesson 7, Resource Leveling, is complete at `/learn/resource-leveling`. The
learner schedules three features with one designer and two developers, sees
the designer triple-booked on paper, spends float to resolve part of it, and
extends the end date for the rest. Insight: a plan that overloads a person is
not a plan; leveling trades float, then time, for feasibility.

Scenario (days). Verified: CPM 8 days; designer demand 3 on days 0 and 1
(capacity 1); developer demand 3 on day 3 (capacity 2).

| id | task     | days | after | resource  | ES | EF | LS | LF | float |
| -- | -------- | ---- | ----- | --------- | -- | -- | -- | -- | ----- |
| X1 | Design X | 3    |       | designer  | 0  | 3  | 0  | 3  | 0     |
| X2 | Build X  | 4    | X1    | developer | 3  | 7  | 3  | 7  | 0     |
| X3 | Review X | 1    | X2    | designer  | 7  | 8  | 7  | 8  | 0     |
| Y1 | Design Y | 2    |       | designer  | 0  | 2  | 2  | 4  | 2     |
| Y2 | Build Y  | 3    | Y1    | developer | 2  | 5  | 4  | 7  | 2     |
| Y3 | Review Y | 1    | Y2    | designer  | 5  | 6  | 7  | 8  | 2     |
| Z1 | Design Z | 2    |       | designer  | 0  | 2  | 4  | 6  | 4     |
| Z2 | Build Z  | 2    | Z1    | developer | 2  | 4  | 6  | 8  | 4     |

Leveling within float: Z1 moves to days 3 to 5 (inside its float), Y1 cannot
be placed within its float because the designer is busy until day 3, so one
conflict remains. Full leveling (min latest-start first, designer 1, developer
2): 9 days with X1 0–3, Y1 3–5, Z1 5–7, X2 3–7, Y2 5–8, Z2 7–9, X3 7–8, Y3 8–9.
Shortest-first rule: 12 days. Two designers: 8 days. One developer: 12 days.

## Step-by-step

1. **Engine** `src/engine/resource-leveling/`:
   - `types.ts`: `Resource = "designer" | "developer"`,
     `Task { id; name; days; deps; resource }`, `Schedule = Record<id, { start; end }>`,
     `Capacities = Record<Resource, number>`.
   - `fixture.ts`: `FEATURES: Task[]`, `DEFAULT_CAPACITIES = { designer: 1, developer: 2 }`.
   - `cpm.ts`: forward and backward pass for this fixture (ES/EF/LS/LF/float).
   - `profile.ts`: `demand(tasks, schedule): Record<Resource, number[]>` per
     day, `overloads(demand, capacities): { resource; day; demand }[]`.
   - `level.ts`: `levelWithinFloat(tasks, capacities): { schedule; unresolved: string[] }`
     (for each overloaded day, delay the task with the most float by one day
     at a time while it stays within float; push successors; repeat until no
     change), `level(tasks, capacities, rule: "min-lst" | "shortest"): Schedule`
     (serial schedule generation), `makespan(schedule)`,
     `shift(schedule, tasks, id, newStart)` (moves a task and pushes successors;
     used by drag).
   - `level.test.ts`: the table; overload days; `levelWithinFloat` leaves
     `unresolved` = ["Y1"] and Z1 at day 3; `level` min-lst makespan 9 with the
     starts above; shortest 12; two designers 8; one developer 12; `shift`
     pushes X2 when X1 moves.

2. **Scene** `src/scenes/resource-leveling/`:
   - `gantt.tsx`: eight rows grouped by feature, 0 to 12-day axis, bars
     draggable along x (snap to days, successors pushed live), float ghosts.
   - `lanes.tsx`: two histogram lanes under the Gantt (designer, developer)
     with a capacity line; overloaded days hatched in `constraint`; bars
     animate with `layout`.
   - `scene.tsx`: state `{ schedule, capacities, rule }`; readouts "End day",
     "Overloaded days". Controls: Level within float (beat 2), Level (beat 3),
     rule `Segmented` min-LST / shortest (beat 4), capacity toggles designer
     1 / 2 and developer 1 / 2 (beat 5), Reset.
   - `thumbnail.tsx`: static Gantt with a hatched lane.

3. **Beats** in `src/content/lessons/resource-leveling.tsx`:
   1. *On paper it is 8 days and the designer is triple-booked.* Lanes show 3
      over a capacity of 1 on days 0 and 1 and 3 developers on day 3.
   2. *Spend float first.* Level within float: Z1 slides to day 3; Y1 flashes
      because its float runs out; one overload remains.
   3. *When float runs out, the end date moves.* Level: the 9-day schedule
      settles; both lanes within capacity.
   4. *The order you pick matters.* Shortest-first gives 12 days: tiny tasks
      hog the designer while the long critical feature waits.
   5. *Try it: drag bars, or hire.* Dragging a bar updates the lanes live; a
      second designer brings the plan back to 8; a single developer costs 12.
   Check: "Which of these can leveling change?" options task durations / task
   start dates and order / dependencies, answer the second, why: leveling only
   moves work in time.

4. **Register**, verify in the browser (drag pushes successors visibly; lanes
   recolour as overloads appear and disappear; keyboard moves the focused bar),
   commit (`feat(lesson): resource leveling`), push.

## Acceptance criteria

- [ ] AC1: Engine tests pass for the table, `levelWithinFloat` unresolved = ["Y1"], `level` min-lst = 9 with the listed starts, shortest = 12, two designers = 8, one developer = 12.
- [ ] AC2: Beat 1's lanes show hatched overloads on designer days 0–1 and developer day 3.
- [ ] AC3: Beat 2 moves only Z1 and leaves one hatched day; beat 3 shows no hatched day and an end day of 9.
- [ ] AC4: Beat 4's rule toggle animates to a 12-day schedule and back.
- [ ] AC5: Dragging X1 right by one day in beat 5 pushes X2 and X3 and updates the lanes; the capacity toggles give 8 and 12.
- [ ] AC6: Scene `aria-label` reports end day and overloaded days; the lesson meets the phase 1 quality bar.
- [ ] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
