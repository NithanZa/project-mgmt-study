# Teaching Depth

## Outcome

Lessons 4 and 5 (`fast-tracking`, `crashing`) explain their method carefully.
Each gains one new beat that makes its hidden model visible (the rework risk
model; the daily overhead line), spotlight terms wired to the scene, two
predicts, whys, and a recap. Every existing interaction stays.

The two lessons are independent. Step 1 may be done for both concurrently.

## Step-by-step

1. **Per lesson** (independent; do both):

   **1a. `fast-tracking`** (`src/content/lessons/fast-tracking.tsx`, `src/scenes/fast-tracking/{scene,gantt,net-curve,risk-meters}.tsx`)
   - New beat `risk` between `drag` and `sweet-spot` (six beats). In
     `scene.tsx` shift every beat gate (`enter`, `draggableOn`, `pulse`, the
     NetCurve and RiskMeters gates, the controls gate) by one from `risk`
     onward; on entering `risk`, if `overlaps[0]` is 0 set it to `best[0]` so
     the tint has something to show. Focal change in `gantt.tsx`: the
     predecessor bar tints its last `overlaps[i]` days (`useSpot("unfinished")`)
     and shows the label `pct(edges[i].risk)`; the tint follows the drag.
   - Scene tags in `gantt.tsx`: the Plan marker `useSpot("plan")`, the Exp.
     marker `useSpot("expected")`, each hatch plus its `−N` label
     `useSpot("overlap")`, each dotted rework box `useSpot("rework")`, a thin
     connector at each `predEnd` on the sequential beat `useSpot("finish-to-start")`,
     and a bracket between Plan and Exp. labelled `+{expectedRework}`
     (`useSpot("expected")`). In `risk-meters.tsx` tag bars `useSpot("risk")`
     and the `+Nd` values `useSpot("rework")`. In `net-curve.tsx` tag the
     polyline `useSpot("net")`, the peak line and labels `useSpot("sweet-spot")`,
     and set the x-axis end label to `MAX_OVERLAP[edge]` instead of a fixed
     20d.
   - Copy: `sequential` body appends "so the <Term id="expected">expected
     finish</Term> equals the <Term id="plan">plan</Term>." and wraps
     "Finish-to-start" in `<Term id="finish-to-start">`. `drag` body becomes
     "Drag {foundations.name} to start {days(halfway.saved)} before
     {design.name} ends. That <Term id="overlap">overlap</Term> moves the
     <Term id="plan">planned finish</Term> {days(halfway.saved)} sooner."
     `risk` title "Risk is the unfinished share of Design." body "When
     {foundations.name} starts {days(halfway.saved)} early, {pct(halfway.risk)}
     of {design.name} is still <Term id="unfinished">unfinished</Term>, so
     that is the chance its work changes. <Term id="rework">Expected rework</Term>
     is that chance times {days(halfway.saved)}: {days(halfway.expectedRework)}."
     `sweet-spot` wraps "Net saving" in `<Term id="net">` and "peaks" in
     `<Term id="sweet-spot">`.
   - Predicts: on `drag`: "{foundations.name} starts {days(halfway.saved)}
     early. On average, how much sooner does the house finish?" options
     `days(halfway.saved)` / `days(halfway.net)` / "No sooner", answer the
     second, why "{days(halfway.expectedRework)} of expected rework eats half
     the saving." On `presets`: "Max overlap plans {days(maxed.planned)}.
     Expected finish?" options "About {days(maxed.planned)}" / "Only a few
     days under {days(sequential.expected)}" / "Later than sequential",
     answer the second, why "Rework adds about {whole(maxed.expectedRework)}
     back."
   - Why on `sweet-spot`: "Risk grows with overlap, and so do the days at
     stake, so rework grows with the square. Early overlap days are nearly
     free; the last ones cost almost a full day each."
   - Recap: lay phases end to end; read the planned finish → `sequential`;
     start a successor early on partial information → `drag`; rate risk as
     how unfinished the predecessor is → `risk`; overlap until saved minus
     expected rework peaks → `sweet-spot`; repeat per handoff; judge the
     expected finish → `presets`.

   **1b. `crashing`** (`src/content/lessons/crashing.tsx`, `src/scenes/crashing/{scene,network,cost-chart}.tsx`)
   - New beat `overhead` between `two-paths` and `stop` (six beats). In
     `scene.tsx`, `PRESET` becomes `[0,1,2,2,2,2]`; the overhead line shows
     from `overhead`; the total line, min marker, Total readout and the
     overhead slider move to `stop` and later; the slider mounts only on
     `try` (it is unused on `stop`); the Graphics button moves to `try`. In
     `cost-chart.tsx` split `showTotal` into `showOverhead` and `showTotal`,
     label the overhead line `−{money(overhead)}/d`, and label each direct
     segment with its step price `+{money(step.cost)}`.
   - Scene tags: in `network.tsx` split the badge into `<tspan>`s tagged
     `useSpot("slope")` (cost per day) and `useSpot("limit")` (min days; the
     lock also matches `limit`), tag critical nodes and edges
     `useSpot("critical")`, the days text `useSpot("crash")`, and accept a
     `spotTasks?: { id: string; spot: string }[]` prop so the scene can tag
     the Design node `shared` and the Fabricate + Graphics nodes `pair` on
     `two-paths`. In `cost-chart.tsx` tag direct segments and label
     `useSpot("direct")`, the last point `useSpot("point")`, the overhead
     path and label `useSpot("overhead")`, the total path and label
     `useSpot("total")`, `g[data-optimum]` and the drop line `useSpot("min")`.
     The Total readout gets `spot="total"`.
   - Copy: `prices` body "<Term id="crash">Crashing</Term> pays to shorten a
     task. Each badge shows its <Term id="slope">cost per day</Term> and
     <Term id="limit">crash limit</Term>; the lit <Term id="critical">critical
     path</Term> sets the finish at {days(schedule(BOOTH).duration)}."
     `cheapest` appends "The <Term id="direct">direct cost</Term>
     <Term id="point">point</Term> moves one day left and {money(first.step!.cost)}
     up." (trim the body to 40 words). `two-paths` wraps the shared task in
     `<Term id="shared">` and the pair in `<Term id="pair">`. `overhead` title
     "Every day the booth runs costs money." body "Running the project costs
     {money(DEFAULT_OVERHEAD)} a day. Each day you cut saves that much
     <Term id="overhead">overhead</Term>, so its line falls as the schedule
     shortens." `stop` wraps "total" in `<Term id="total">` and "lowest" in
     `<Term id="min">`.
   - Predicts: on `prices`: "Crash {graphics.name} by a day. Does the booth
     finish sooner?" options "Yes, a day sooner" / "No", answer No, why "It
     has {days(schedule(BOOTH).float.C)} of float; {name('B')} still sets the
     pace." On `overhead`: "Is the cheapest total at the shortest schedule,
     {days(curve.at(-1)!.days)}?" options "Yes" / "No, in between" / "No, the
     original {days(curve[0].days)}", answer the second, why "From
     {days(best.days)} on, each day costs more than {money(DEFAULT_OVERHEAD)}."
   - Whys: `cheapest` "Any critical task cut by a day moves the finish one
     day, so every option buys the same thing. Take the lowest price;
     non-critical tasks buy nothing." `two-paths` "The finish is the longer
     path, and both take {days(first.days)}. Cutting only one leaves the other
     at {days(first.days)}, so the finish stays put." `stop` "Each crashed day
     costs its step price and saves {money(DEFAULT_OVERHEAD)}. Down to
     {days(best.days)} every price was lower; the next, {money(afterBest.cost)},
     is higher." `try` "Both paths take {days(second.days)} here;
     {graphics.name} shortens only one, so you pay without gaining a day."
   - Recap: list each task's cost per day and crash limit; find the critical
     path → `prices`; crash the cheapest critical task one day; recheck →
     `cheapest`; when paths tie, cut all of them → `two-paths`; add daily
     overhead to direct cost → `overhead`; stop when the next day costs more
     than its overhead → `stop`.

2. **Verify in the browser** (`pnpm dev`) for both lessons: the new beat has
   exactly one focal change; the controls strip mounts only on beats that use
   it (crashing's slider only on `try`); every term lights something; predicts
   reveal engine-derived answers; whys open; recap jumps; drag, presets,
   Crash, Undo, Reset and the slider still work; phones (375 px) still show
   the canvas.

3. **Run** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Acceptance criteria

- [x] AC1: `fast-tracking` has six beats `sequential, drag, risk, sweet-spot, presets, try`; on `risk` the predecessor bar tints its overlapped tail with the risk percentage and the tint follows the drag; the net curve's x-axis end label equals the edge's maximum overlap.
- [x] AC2: `fast-tracking` terms `expected, plan, finish-to-start, overlap, unfinished, rework, net, sweet-spot` light `[data-spot]` elements; predicts on `drag` and `presets` compute from `edge()` / `schedule()`; a why on `sweet-spot`; a five-step recap.
- [x] AC3: `crashing` has six beats `prices, cheapest, two-paths, overhead, stop, try`; the overhead line first appears on `overhead`, the total line and min marker on `stop`, the overhead slider only on `try`; each direct segment shows its step price label.
- [x] AC4: `crashing` terms `crash, slope, limit, critical, direct, point, shared, pair, overhead, total, min` light `[data-spot]` elements; predicts on `prices` and `overhead` compute from `schedule()` and `crashCurve()`; whys on `cheapest`, `two-paths`, `stop`, `try`; a five-step recap.
- [x] AC5: No beat body or why exceeds 40 words; no predict answer appears in its own beat's body; `src/content/teaching.test.ts` passes; the crashing check still answers from the engine.
- [x] AC6: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
