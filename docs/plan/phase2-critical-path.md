# PM Methods Interactive Course

## Outcome

Lesson 1, Critical Path Method, is complete at `/learn/cpm`. The learner opens
a coffee shop: eight tasks in weeks, a forward pass, a backward pass, float, the
critical path, and a sandbox where delaying a task shows whether the opening
moves. Insight: the longest chain of dependent tasks sets the finish date, and
only tasks on it matter for the date.

Scenario (weeks). Verified: duration 12, critical path A B E F H.

| id | task              | weeks | after | ES | EF | LS | LF | float | grid (col,row) |
| -- | ----------------- | ----- | ----- | -- | -- | -- | -- | ----- | -------------- |
| A  | Sign lease        | 2     |       | 0  | 2  | 0  | 2  | 0     | 0,1            |
| B  | Permits           | 4     | A     | 2  | 6  | 2  | 6  | 0     | 1,0            |
| C  | Renovation        | 6     | A     | 2  | 8  | 4  | 10 | 2     | 1,1            |
| D  | Order equipment   | 3     | A     | 2  | 5  | 6  | 9  | 4     | 1,2            |
| E  | Hire staff        | 3     | B     | 6  | 9  | 6  | 9  | 0     | 2,0            |
| G  | Install equipment | 1     | C, D  | 8  | 9  | 10 | 11 | 2     | 2,2            |
| F  | Train staff       | 2     | E, D  | 9  | 11 | 9  | 11 | 0     | 3,0            |
| H  | Soft opening      | 1     | F, G  | 11 | 12 | 11 | 12 | 0     | 4,1            |

Presets (verified): Renovation 6 → 9 gives 13 weeks with path A C G H;
Order equipment 3 → 8 gives 13 weeks with path A D F H; Permits 4 → 2 gives 10
weeks with two critical paths (A B E F H and A C G H).

## Step-by-step

1. **Engine** `src/engine/critical-path/`:
   - `types.ts`: `Task { id; name; weeks; deps: string[]; pos: { col; row } }`.
   - `fixture.ts`: `COFFEE_SHOP: Task[]` from the table.
   - `cpm.ts`: `computeCriticalPath(tasks): { duration; order; rows: Record<id, { es; ef; ls; lf; float; critical }>; criticalPaths: string[][] }`.
     Kahn topological order (throw `CycleError` on a cycle), forward pass,
     backward pass, `criticalPaths` enumerated by depth-first walk over
     zero-float edges from every zero-float start task.
     `withWeeks(tasks, id, weeks)` returns a new array.
   - `cpm.test.ts`: the full table; the three presets; `criticalPaths.length`
     is 1 by default and 2 for Permits = 2; a cycle throws; inputs are not
     mutated (deep-freeze the fixture).

2. **Scene** `src/scenes/critical-path/`:
   - `network.tsx`: 5 columns × 3 rows grid. Nodes are `motion.div` boxes
     (name, weeks, and ES/EF above, LS/LF below when revealed) positioned by
     `pos`; edges are `motion.path` in an underlying `<svg>` with arrowheads.
     Critical nodes and edges use `accent` and a 2 px thicker stroke; float
     nodes show a small `float`-coloured bar whose width is proportional to
     float. Hovering or focusing a node highlights its predecessors.
     Props: `tasks`, `result`, `reveal: "none" | "forward" | "backward" | "all"`,
     `progress` (0..1 for the ripple), `selected`, `onSelect`.
   - `gantt-strip.tsx`: a compact Gantt under the network (one row per task,
     weeks 0 to 14 axis, float as a dashed ghost after EF), shown from beat 4.
   - `scene.tsx`: holds `tasks` state (durations), computes the result with
     `useMemo`, drives the ripple with a motion value and `animate()` on Play.
     Readouts: "Opening: week 12", "Critical paths: 1". Controls (beat 5):
     a `Segmented` of presets (Renovation 9, Equipment 8, Permits 2, Reset)
     and, when a node is selected, a `Slider` 1 to 10 weeks for that task.
     `aria-label` example: "Network of 8 tasks, critical path A B E F H, 12 weeks".
   - `thumbnail.tsx`: static SVG of the network with the critical path lit.

3. **Beats** in `src/content/lessons/cpm.tsx` (titles are the takeaways; bodies
   are directions for the final copy, two sentences max):
   1. *Eight tasks, one question: opening week?* Network, `reveal: "none"`.
      Hover shows what each task waits for.
   2. *Walk forward for the earliest start.* `reveal: "forward"`, Play animates
      the ripple left to right in topological order; ES/EF appear as reached.
   3. *Walk backward for the latest start.* `reveal: "backward"`, ripple right to
      left; float bars grow on C, D and G.
   4. *Zero float is the critical path.* `reveal: "all"`: A B E F H light up, the
      Gantt strip slides in, readout "week 12".
   5. *Try it: delay a task, watch the opening.* Presets and slider. Delaying
      Renovation by 2 changes nothing; by 3 it becomes critical and the opening
      moves to 13. Permits at 2 shows two critical paths.
   Check: "Renovation slips by 2 weeks. The opening moves by…" options 0 / 1 / 2
   weeks, answer 0, why: Renovation has 2 weeks of float.

4. **Register** in `src/content/lessons/index.ts` (replaces the placeholder).

5. **Verify in the browser** at 1280 px and 375 px, light and dark: the ripple
   plays in order, float bars match the table, each preset gives the verified
   result, the slider snaps to whole weeks, ArrowLeft / ArrowRight never move
   the slider.

6. Commit (`feat(lesson): critical path method`) and push.

## Acceptance criteria

- [ ] AC1: `computeCriticalPath(COFFEE_SHOP)` returns duration 12, the ES/EF/LS/LF/float table above, and `criticalPaths` equal to `[["A","B","E","F","H"]]`.
- [ ] AC2: The three presets produce 13 (path A C G H), 13 (path A D F H) and 10 (two paths) in both the engine tests and the readouts.
- [ ] AC3: Beat 2's ripple reveals ES/EF in topological order and beat 3's reveals LS/LF right to left; both play under 1.5 s and can be replayed.
- [ ] AC4: Beat 4 shows the critical path in `accent` with thicker edges and the Gantt strip with float ghosts of 2, 4 and 2 weeks.
- [ ] AC5: In beat 5 moving the Renovation slider to 8 keeps the opening at 12 and moving to 9 changes it to 13 with the path switching through C and G.
- [ ] AC6: Scene `aria-label` updates with the current duration and path; all controls work by keyboard; the scene never remounts across beats.
- [ ] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
