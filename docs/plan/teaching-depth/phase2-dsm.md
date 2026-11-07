# Teaching Depth

## Outcome

Lesson 6, Design Structure Matrix (`/learn/dsm`), teaches the method
carefully enough that a newcomer can read a matrix, say why a mark right of
the diagonal means rework, say why partitioning cannot remove a true loop, and
apply the five-step method on their own. It does this with two new beats,
spotlight terms wired into the scene, one predict, three whys and a recap,
while keeping every existing interaction (view morph, hover-to-graph, drag and
keyboard reorder, Partition, Best order, the iterate chip).

What the current lesson never explains (planning audit):

- how to read a cell (row needs column), and that rows and columns share one
  order, so the diagonal is each task's own slot;
- why "above" means "planned later" and therefore a guess that gets redone;
- the dashed Testing to Engineering arrow is never named as feedback before the
  matrix appears;
- why Partition leaves one ring (E, P, T form a cycle, so one of them must go
  first without its input);
- what "coupled block" and "iterate" mean in practice;
- the method as steps the learner could repeat.

New beat order (7 beats; `BEAT` in `src/scenes/dsm/scene.tsx` becomes
`{ inputs: 0, matrix: 1, diagonal: 2, rework: 3, partition: 4, play: 5, plan: 6 }`):

| # | id          | title                                   | focal change                                                        | controls                    |
| - | ----------- | --------------------------------------- | ------------------------------------------------------------------- | --------------------------- |
| 0 | `inputs`    | Every arrow is an input a task needs.   | Graph only; hovering a node lights its inputs; the T to E arrow is named | none                   |
| 1 | `matrix`    | A matrix shows every input in one grid. | View toggle; nodes morph into row headers; marks appear              | View: Graph / Matrix        |
| 2 | `diagonal`  | The diagonal is the order of work.      | Diagonal cells darken; an "earlier → later" label spans the column headers | none                  |
| 3 | `rework`    | Right of the diagonal means rework.     | Upper triangle tints; dots below dim (as today)                     | none                        |
| 4 | `partition` | Sort until only true loops remain.      | Partition slides rows; block outline appears (as today)             | Partition, Reset            |
| 5 | `play`      | Try it: drag rows, chase the count down.| Rows become movable (as today)                                       | Reset, Best order           |
| 6 | `plan`      | Plan the loop as one iteration.         | Plan strip replaces the graph (as today)                             | Reset, Best order           |

Every number in copy still comes from `src/engine/dsm/dsm.ts` via the
constants already computed at the top of `src/content/lessons/dsm.tsx`
(`total`, `alphabetical`, `best`, `loops`, `loop`, `block`, `before`, `after`).

## Step-by-step

1. **Engine helper** in `src/engine/dsm/dsm.ts`: add
   `inputsOf(activities, id): string[]` (the `deps` of that activity, in
   fixture order) and `backwardMarks(activities): Mark[]` (marks whose `col`
   appears later than `row` in fixture order; for `BIKE` this is exactly the
   T to E mark). Add tests in `dsm.test.ts`: `inputsOf(BIKE, "E")` is
   `["C","I","T"]`; `backwardMarks(BIKE)` equals `[{ row: "E", col: "T" }]`.

2. **Graph hover** in `src/scenes/dsm/graph.tsx`:
   - New prop `hotNode?: string | null` and `onHotNode?: (id: string | null) => void`.
     When `onHotNode` is given, each node `div` becomes a `motion.button`
     (`type="button"`, `aria-label="{name}: needs {inputs or 'nothing'}"`) with
     pointer enter/leave, focus/blur and click handlers that set `hotNode`.
     Nodes keep their `layoutId` so the beat 1 morph is unchanged.
   - While `hotNode` is set, the edges into that node and their source nodes
     use the `accent` colour and thicker stroke; all other edges drop to 35 %
     opacity (opacity only, `FADE`). This is the same emphasis the mark hover
     already uses for a single edge.
   - Spotlight targets: wrap the T to E path in `useSpot("feedback")`
     attributes; wrap every other edge in `useSpot("inputs")`; the node group
     for each id gets `useSpot(\`node-${id}\`)` (used by the `row-e` term in
     beat 1 through the matrix, see step 4).

3. **Scene state and beats** in `src/scenes/dsm/scene.tsx`:
   - Replace `BEAT` with the seven-beat table above. `shownView` is `"graph"`
     on `inputs`, the learner's `view` on `matrix`, and `"matrix"` after that.
     `shown` is `ALPHABETICAL` through `rework`, the learner's `order` after.
     `showBlock` from `partition`; `movable` from `play`; the plan strip on
     `plan`.
   - Add `hotNode` state, passed to `Graph` only on `inputs` (the compact
     graph beside the matrix keeps the existing mark hover).
   - Readouts: on `inputs`, "Activities" and "Dependencies" as today plus
     "Inputs" showing `inputsOf(BIKE, hotNode).length` while a node is hot
     (label the readout with the node id, for example "Inputs of E"); on
     matrix beats, "Marks above diagonal" gets `spot="count"` and the block
     readout stays.
   - Controls: `inputs` none; `matrix` the View segmented control (default
     view stays `"graph"` so the copy's "Switch to Matrix" is real);
     `diagonal` and `rework` none; `partition`, `play`, `plan` as today.
   - `aria-label`: on `inputs` include the hot node's inputs when set; on
     `diagonal` append "Rows and columns share the order; the diagonal is each
     task's own slot."; otherwise as today with the new beat ids.

4. **Matrix spotlight targets** in `src/scenes/dsm/matrix.tsx`:
   - The `UPPER` polygon gets `useSpot("above")`; add a matching `LOWER`
     staircase polygon (cells below the diagonal) with `useSpot("below")`,
     `fill-accent/10`, opacity 0 unless lit or `stressRework` is false and the
     beat is `diagonal` (prop `stressOrder: boolean`, see next point).
   - New prop `stressOrder: boolean` (true on `diagonal`): the diagonal
     `rect`s change from `fill-fg/10` to `fill-fg/25` and a label row above
     the column headers reads `earlier → later` (muted, `text-xs`, with
     `useSpot("diagonal")` together with the diagonal rects). The label is a
     label, which the quality bar allows inside a scene.
   - Each column header gets `useSpot("columns")`; each row header gets
     `useSpots(["rows", \`row-${id}\`])` and each mark
     `useSpots(["ring" or "dot", \`row-${row}\`])`, so the `row-e` term lights
     row E's header and its three marks together (`useSpots` is from phase 1).
   - The block outline gets `useSpot("block")`, and the ring that remains in
     the best order (the T to E mark) also answers to `"loop"`.
   - Hovering a row header (not only a mark) now sets `hot` to the first mark
     of that row and lights all of the row's marks; the existing
     `onHot(mark)` API is reused by lifting a `hotRow` through `onHotRow`.
     Keep this cheap: a header `onPointerEnter` sets `hotRow`, and `Row`
     applies `bg-accent-soft` to its marks when `hotRow === id`.

5. **Iteration plan targets** in `src/scenes/dsm/iteration-plan.tsx`: chips
   before the block get `useSpot("sequence")`, the iterate chip
   `useSpot("iterate")`, chips after the block `useSpot("sequence")`.

6. **Copy** in `src/content/lessons/dsm.tsx`. Import `Term` from
   `@/components/lesson/term` and `inputsOf` from the engine. Beats:
   1. `inputs` — title "Every arrow is an input a task needs." Body:
      "Hover or focus {name('E')}: it needs {list(inputsOf(BIKE,'E').map(name))}.
      The dashed arrow from {name(loop.col)} runs backwards: a
      <Term id="feedback">feedback</Term> arrow, because {name(loop.col)}
      happens after {name(loop.row)} yet feeds it." (trim to 40 words).
      Why: "Each arrow points from an output to the task that consumes it.
      Testing can only test a built prototype, but what it finds changes the
      engineering, so the arrow runs back."
   2. `matrix` — title "A matrix shows every input in one grid." Body:
      "Switch the view to Matrix: each activity becomes a <Term id="rows">row</Term>
      and a <Term id="columns">column</Term>. Read across
      <Term id="row-e">row E</Term>: its marks sit under C, I and T, the inputs
      Engineering needs."
   3. `diagonal` — title "The diagonal is the order of work." Body: "Rows and
      columns share one order, so the shaded <Term id="diagonal">diagonal</Term>
      is each task's own slot. A mark <Term id="below">left of it</Term> needs
      an earlier task; a mark <Term id="above">right of it</Term> needs a later
      one." Why: "Left of the diagonal the input is finished before the row
      starts. Right of it the input does not exist yet, so the row starts on an
      assumption."
   4. `rework` — title "Right of the diagonal means rework." Body: "A
      <Term id="ring">ring</Term> marks a row that needs something planned
      later, so it starts on a guess and is redone when the input arrives. In
      alphabetical order {alphabetical} of {total} marks are rings. Hover or
      focus a ring to find its edge." (trim to 40 words).
   5. `partition` — body as today, plus `predict`: prompt "Before you press
      Partition: how many rings can the best order leave?", options `["0",
      "1", "4"]` built from `[0, loops.count, alphabetical]` with
      `answer` the index of `loops.count`, why "{name(loop.col)} needs
      {name('P')}, which needs {name(loop.row)}, which needs {name(loop.col)}:
      a cycle, so one of them must go first." Wrap "coupled block" in
      `<Term id="block">` and "{rings(loops.count)} remain" in
      `<Term id="loop">`. Why: "Partitioning only reorders. A cycle has no first
      task: whichever of {list(block)} goes first needs one planned later, so
      one ring always remains."
   6. `play` — body as today; wrap "count" (add the word if missing:
      "chase the <Term id="count">count</Term> down") so the readout lights.
   7. `plan` — body as today with "in sequence" wrapped in
      `<Term id="sequence">` and "iterate" in `<Term id="iterate">`. Why:
      "Inside the block, run short {block.join(' → ')} cycles so Testing's
      feedback returns in days, not after Tooling has started. Rework still
      happens, but each round is small."
   Recap (`lesson.recap`):
   1. "List activities and the inputs each one needs" → `inputs`
   2. "Put them in a matrix: rows need columns" → `matrix`
   3. "Order rows; marks right of the diagonal are rework" → `rework`
   4. "Partition: move every input you can ahead" → `partition`
   5. "What stays is a coupled block: iterate it" → `plan`
   The check stays as it is (reading an above-diagonal mark).

7. **Thumbnail** needs no change. The e2e test does not count beats, so it
   needs no change either.

8. **Verify.** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. In
   `pnpm dev`: beat 0 node hover lights inputs and the readout; the `feedback`
   term pulses the dashed arrow; beat 1 morph still lands every node on its
   header; `row-e` lights row E's header and three marks; beat 2 shows the
   darker diagonal and the earlier → later label; `below` and `above` light
   the two triangles; the predict on beat 4 reveals 1 with the cycle why;
   Partition, drag, Alt+arrows, Best order, and the iterate chip all still
   work; reduced motion still reads.

## Acceptance criteria

- [x] AC1: `inputsOf(BIKE, "E")` returns `["C","I","T"]` and `backwardMarks(BIKE)` returns the single T to E mark, both pinned in `src/engine/dsm/dsm.test.ts`.
- [x] AC2: The lesson has the seven beats `inputs, matrix, diagonal, rework, partition, play, plan` in that order, each body at most 40 words, and `src/content/teaching.test.ts` passes.
- [x] AC3: On beat `inputs`, hovering or focusing a graph node lights its incoming edges and source nodes, the "Inputs" readout shows the count, and the scene `aria-label` names the inputs; the `feedback` term lights only the T to E edge.
- [x] AC4: Every `Term` id used in the DSM copy (`feedback, rows, columns, row-e, diagonal, below, above, ring, block, loop, count, sequence, iterate`) has at least one visible `[data-spot]` element in the scene on its beat, and hovering the term sets `data-lit` on it while other tagged elements dim.
- [x] AC5: Beat `diagonal` darkens the diagonal cells and shows the "earlier → later" label; beats `rework` through `plan` behave exactly as before (tint, Partition, block outline, drag and keyboard reorder, Best order, plan strip).
- [x] AC6: Beat `partition` shows a predict whose correct option equals `loops.count` and whose reveal names the E, P, T cycle; beats `inputs`, `diagonal`, `partition` and `plan` show a Why disclosure of at most 40 words; the last beat shows a five-step recap whose steps jump to `inputs, matrix, rework, partition, plan`.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
