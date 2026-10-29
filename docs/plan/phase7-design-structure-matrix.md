# PM Methods Interactive Course

## Outcome

Lesson 6, Design Structure Matrix, is complete at `/learn/dsm`. The learner
sees a bike development process as a graph and as a matrix, discovers that
marks above the diagonal are feedback loops that cause rework, partitions the
matrix to isolate the one true loop, and plans that loop as a single iteration.
Insight: mapping task relationships as a matrix reveals the sequence that
minimises rework and shows which tasks must be done together.

Scenario. Eight activities, eleven dependency marks. Verified.

| id | activity            | depends on               |
| -- | ------------------- | ------------------------ |
| M  | Market requirements |                          |
| C  | Concept             | M                        |
| I  | Industrial design   | C                        |
| E  | Engineering         | C, I, T (test feedback)  |
| P  | Prototype           | E, I                     |
| T  | Testing             | P                        |
| L  | Tooling             | E                        |
| R  | Release             | T, L                     |

Marks above the diagonal: alphabetical order (C E I L M P R T) 4; partitioned
order (M C I E P T L R) 1, the unavoidable Testing → Engineering feedback;
reverse order 10. The only coupled block is {E, P, T}.

## Step-by-step

1. **Engine** `src/engine/dsm/`:
   - `types.ts`: `Activity { id; name; deps: string[] }`, `Order = string[]`.
   - `fixture.ts`: `BIKE: Activity[]`, `ALPHABETICAL: Order`.
   - `dsm.ts`: `marks(activities): { row; col }[]`,
     `feedback(activities, order): { count; marks: { row; col; span }[] }`
     (`span` = how many positions above the diagonal),
     `partition(activities): { order: Order; blocks: string[][] }` (Tarjan
     strongly connected components, condensation ordered topologically,
     members of a block kept in dependency order where possible),
     `moveRow(order, from, to)`.
   - `dsm.test.ts`: 11 marks; feedback counts 4 / 1 / 10 for the three orders;
     the block is exactly {E, P, T}; `partition` order starts with M and ends
     with R; `moveRow` keeps all ids.

2. **Scene** `src/scenes/dsm/`:
   - `graph.tsx`: the eight nodes on a left-to-right layout with the T → E
     feedback drawn as a curved return arrow in `constraint`.
   - `matrix.tsx`: 8 × 8 grid; row and column headers are `motion.div` with
     `layoutId={`row-${id}`}` and `layoutId={`col-${id}`}` so a reorder slides
     headers and cells; a mark below the diagonal is an `accent` dot, above the
     diagonal a `constraint` ring (two channels: colour and shape); the
     diagonal is shaded; blocks get an outline. Rows reorder by drag with
     `Reorder.Group` / `Reorder.Item` and by keyboard (focus a row header,
     Alt+ArrowUp / Alt+ArrowDown).
   - `morph.tsx`: beat 1 animates graph nodes into the matrix headers by giving
     graph nodes and headers the same `layoutId` and switching which is
     rendered.
   - `iteration-plan.tsx`: beat 5's strip: activities in partition order as
     chips, with E P T collapsed into one "iterate" chip that expands to show
     the loop.
   - `scene.tsx`: state `order`; readouts "Marks above diagonal", "Coupled
     block". Controls: Partition button (beat 3), Reset to alphabetical, Best
     (beats 4 and 5). Hovering a mark highlights the same edge in the graph.
   - `thumbnail.tsx`: static matrix with the block outlined.

3. **Beats** in `src/content/lessons/dsm.tsx`:
   1. *A graph hides what a matrix shows.* Nodes fly into headers; 11 marks
      appear; alphabetical order shows 4 above the diagonal.
   2. *Above the diagonal means rework.* Hover a ring: the graph edge pulses;
      the row needs something planned later.
   3. *Sort until only true loops remain.* Partition: rows and columns slide to
      M C I E P T L R; one ring remains; {E, P, T} is boxed.
   4. *Try it: drag rows, chase the count down.* Reorder by drag or keyboard;
      the count updates; Best restores the partition.
   5. *Plan the loop as one iteration.* The iteration strip: sequence outside
      the block, iterate inside it with short cycles and close communication.
   Check: "A mark above the diagonal means…" options the task is critical /
   the task depends on one planned after it / the task has float, answer the
   second, why: its input arrives late, so expect a redo.

4. **Register**, verify in the browser (the morph in beat 1 keeps every node
   identifiable; reorder animates without cells tearing; keyboard reorder
   announces the new position through `aria-live`), commit
   (`feat(lesson): design structure matrix`), push.

## Acceptance criteria

- [x] AC1: `feedback(BIKE, ALPHABETICAL).count` is 4, `feedback(BIKE, partition(BIKE).order).count` is 1, and `partition(BIKE).blocks` equals `[["E","P","T"]]` in some order.
- [x] AC2: Beat 1's morph lands every node on its header with the same label, and 11 marks are visible.
- [x] AC3: Hovering or focusing an above-diagonal ring highlights the T → E edge in the graph.
- [x] AC4: Partition in beat 3 animates to the order M C I E P T L R with one ring left and the {E, P, T} block outlined.
- [x] AC5: In beat 4 rows can be reordered by drag and by Alt+arrow keys; the count readout updates on every move; Best restores the partition.
- [x] AC6: Scene `aria-label` reports the current order and feedback count; the lesson meets the phase 1 quality bar.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
