# Teaching Depth

## Outcome

Lessons 1 to 3 (`cpm`, `pert`, `monte-carlo`) explain their method carefully:
how to read each picture, why each step is taken, and how to repeat the method.
Each lesson gains spotlight terms wired to its scene, two or three predicts,
whys where a body states a result without its reason, a recap, and the small
scene additions listed below. Every existing interaction stays.

The three lessons are independent. Step 1 may be done for all three
concurrently (one implementer per lesson); steps 2 and 3 run once at the end.

Shared conventions (from phase 1): `useSpot(id)` / `useSpots(ids)` tag scene
elements; `<Term id>` in copy; `beat.predict`, `beat.why`, `lesson.recap`.
Numbers in copy come from the engine values already imported in each lesson
file. Predict answers must not appear in the same beat's body; where the audit
found one, the body is trimmed as stated.

## Step-by-step

1. **Per lesson** (independent; do all three):

   **1a. `cpm`** (`src/content/lessons/cpm.tsx`, `src/scenes/critical-path/{scene,network,gantt-strip}.tsx`)
   - Scene: in `network.tsx`, tag `data-earliest` rows with `useSpot("es-ef")`,
     `data-latest` rows with `useSpot("ls-lf")`, the float bar with
     `useSpot("float")`, nodes with more than one dependency and their
     incoming edges with `useSpot("merge")`, critical nodes and
     `data-critical` edges with `useSpot("critical-path")`. In
     `gantt-strip.tsx` tag the dashed float ghosts `useSpot("float")`, the
     solid ES to EF bars `useSpot("bar")`, and the opening line
     `useSpot("opening")` with a small label `open {duration}` at its top.
     The "Opening" readout gets `spot="opening"`.
   - Scene: hover explanation of the passes. In `network.tsx`, while the
     forward reveal is on and a node is hovered or focused, its predecessors'
     EF values get the `ring-2 ring-fg` emphasis already used for `waitsFor`
     and a tiny label `max {rows[id].es}` appears above the node; while the
     backward reveal is on, its successors (build a successor map from
     `COFFEE_SHOP` deps once) and their LS values are emphasised with the
     label `min {rows[id].lf}`. Labels are numbers with a one-word prefix.
   - Copy: `forward` wraps "ES" and "EF" in `<Term id="es-ef">`, "last
     predecessor" in `<Term id="merge">`; `backward` wraps "LS" / "LF" in
     `<Term id="ls-lf">` and "float" in `<Term id="float">`; `critical` wraps
     "no float" in `<Term id="critical-path">`, "dashed ghosts" in
     `<Term id="float">` and "week {base.duration}" in `<Term id="opening">`.
   - Predicts: on `network`: "Install equipment waits for Renovation (ends
     week {rows.C.ef}) and Order equipment (ends week {rows.D.ef}). When can
     it start?" options `week {rows.D.ef}` / `week {rows.G.es}` /
     `week {rows.C.ef + rows.D.ef}`, answer the second, why "A task needs every
     input, so it waits for the latest finish." On `forward`: "Order equipment
     feeds two tasks that must start by week {rows.F.ls} and week {rows.G.ls}.
     Latest it can finish?" options the two weeks and `week {base.duration}`,
     answer `rows.D.lf`, why "Finishing later would delay the earlier
     successor." On `critical`: "Order equipment drops from {D.weeks} to 1
     week. The opening moves earlier by…" options 0 / 1 / 2 weeks, answer
     computed from `computeCriticalPath(withWeeks(COFFEE_SHOP,"D",1))`, why
     "D is not critical; its saved time becomes float."
   - Whys: `forward` "A task needs all its inputs, so its earliest start is the
     largest finish among its predecessors. The project ends when the last
     task does." `backward` "A task must finish before its earliest-needed
     successor starts, so LF is the smallest successor LS. Float = LS − ES."
     `sandbox` "Float belongs to a path, not a task: Renovation and Install
     equipment share the same {rows.C.float} weeks. Spend them on one and the
     other has none." (read `rows.C.float`).
   - Recap: list tasks and dependencies → `network`; forward: ES = max
     predecessor EF → `forward`; project end = largest EF → `forward`;
     backward: LF = min successor LS → `backward`; float = LS − ES →
     `backward`; zero-float chain is critical; watch it → `critical`.

   **1b. `pert`** (`src/content/lessons/pert.tsx`, `src/scenes/pert/{scene,estimate-row,project-curve}.tsx`)
   - Scene: in `estimate-row.tsx`, on the tall `ranges` layout draw the
     numbers `o` and `p` at the ends of the range bar (`useSpot("o")`,
     `useSpot("p")`; hidden in strip mode); tag the m tick `useSpot("m")`,
     the moving marker `useSpot("expected")`, and add an overlay path from
     `x(m)` to `x(p)` tagged `useSpot("tail")`. In `project-curve.tsx` draw a
     ±1σ bracket under the bell from `mean − sigma` to `mean + sigma`
     labelled `σ {sigma.toFixed(1)}` (`useSpot("sigma")`), tag the shaded area
     `useSpot("shade")` and the deadline handle `useSpot("deadline")`. On the
     `widen` beat only, show each row's share of project variance as a
     percentage at the row's right end (`useSpot("share")`). Readouts: "Sigma"
     gets `spot="sigma"`, "P(by deadline)" gets `spot="shade"`.
   - Copy: `ranges` wraps optimistic / most-likely / pessimistic in
     `<Term id="o|m|p">`; `expected` wraps "Long pessimistic tails" in
     `<Term id="tail">` and the expected days in `<Term id="expected">`;
     `project` wraps "sigma" in `<Term id="sigma">`, "{modeSum}-day promise"
     in `<Term id="deadline">`, "{pct} chance" in `<Term id="shade">`;
     `commit` wraps "80% commitment" in `<Term id="shade">`; `widen` wraps
     "pessimistic estimate" in `<Term id="tail">`.
   - Predicts: on `ranges`: "{write.name} is {o} / {m} / {p} days. Its
     expected duration will be…" options below / exactly / above {m}, answer
     above, why "Its tail is {p − m} days right but {m − o} left." On
     `expected`: "The most-likely values add to {base.modeSum} days. What
     chance of finishing by then?" options `pct(0.8)` / `pct(0.5)` /
     `pct(base.probabilityBy(base.modeSum))`, answer the third, why "Every
     task's tail leans late, so the sum of peaks is optimistic." On `widen`:
     "{write.name}'s pessimistic goes from {write.p} to {WIDE_PESSIMISTIC}.
     Its share of the project variance becomes…" options "about the same" /
     computed share / "100%", answer the computed share, why "Variance grows
     with the square of the range." Compute shares in `pert.tsx` from
     `variance()` in the engine.
   - Whys: `expected` "The curve is how likely each duration is. With a longer
     right tail, unlucky days outweigh lucky ones, so the average sits right of
     the peak." `project` "Each task's spread is (p − o)/6. Independent misses
     partly cancel, so variances add, not spreads: {sum of task sigmas}
     becomes {base.sigma}." `commit` "Confidence is the shaded share left of
     the deadline. Area grows quickly near the mean and slowly in the tail, so
     each extra 5% costs more days."
   - Recap: estimate o, m, p per task → `ranges`; expected = (o + 4m + p)/6 →
     `expected`; variance = ((p − o)/6)²; add means and variances → `project`;
     read the chance as area left of a date → `project`; commit where the
     shaded share meets your confidence → `commit`; tighten the widest task
     first → `widen`.

   **1c. `monte-carlo`** (`src/content/lessons/monte-carlo.tsx`, `src/scenes/monte-carlo/{scene,stream-network,histogram,criticality-bars,convergence-band}.tsx`)
   - Scene: in `stream-network.tsx`, while a roll is shown, print each
     stream's total (`shortlist + confirm`) at the row's right wire
     (`useSpot("longest")` on the critical row and its total; the range text
     gets `useSpot("estimate")`). In `scene.tsx`, mount readouts
     progressively: "Runs" from `roll`; "P50", "P80" and "PERT" (plus the
     PERT marker through a `showPert` prop on `Histogram`) from
     `distribution`. Tag histogram bins `useSpot("bins")`, markers
     `useSpot("p50" | "p80" | "pert")`, the roll dot `useSpot("roll")`. In
     `criticality-bars.tsx` tag each `<li>` with `useSpots(["share", stream id])`.
     In `convergence-band.tsx` tag the band and sd bar `useSpot("band")`, the
     circle `useSpot("estimate")`, the current-runs line `useSpot("runs")`,
     and add the label `20 sims` at the band's right end.
   - Copy: `roll` wraps "three-point estimate" in `<Term id="estimate">`,
     "longest stream" in `<Term id="longest">`, "the axis" in
     `<Term id="roll">`; `distribution` wraps "histogram" in
     `<Term id="bins">`, P50 / P80 in `<Term id="p50|p80">` and appends
     "PERT's date is the <Term id="pert">dashed line</Term>."; `merge-bias`
     wraps PERT, P50 and "one stream to six" (`<Term id="streams">` lighting
     the `data-stream` rows); `criticality` drops the "jumps to {pct(rushed)}"
     clause and wraps "sets the finish" in `<Term id="share">` and "Speakers"
     in `<Term id="speakers">`; `convergence` wraps "P80 estimate" in
     `<Term id="estimate">`, "wobbles ±" in `<Term id="band">`, "runs" in
     `<Term id="runs">`.
   - Predicts (three): on `distribution`: "What share of runs will finish by
     the dashed PERT date?" options about 80% / about 50% / computed share,
     answer computed from `simFor(DEFAULT_STREAMS).durations` and
     `pertTotal`, why "PERT averages each stream but ignores that the slowest
     one wins." On `merge-bias`: "Every added stream is identical. Each one
     pushes P50 later by…" options the same amount / less each time / more
     each time, answer computed from `simFor(2).p50 − simFor(1).p50` versus
     `simFor(6).p50 − simFor(5).p50`, why "Each new stream must beat the
     current slowest to matter." On `criticality`: "Rush the Speakers'
     confirmation. Their share of runs becomes…" options `pct(1/3)` /
     computed / `100%`, answer computed from `simFor(3, true).criticality[SPEAKERS]`,
     why "Other streams still run late sometimes."
   - Whys: `roll` "Prep can't start until every stream is done, so each
     roll's finish is the slowest stream plus Prep." `distribution` "Each
     column counts runs ending in that half-day. P80 leaves one run in five
     later than your date, a margin most teams can defend." `merge-bias`
     "PERT adds the longest expected stream to Prep. Each extra stream is
     another chance for one to run late, and an early stream can't make up for
     it." `criticality` "CPM names one critical path; under uncertainty every
     stream is critical part of the time. Watch every stream with a large
     share."
   - Recap: give every task o/m/p → `roll`; draw one duration per task; the
     finish is the slowest path → `roll`; repeat thousands of times; plot the
     finishes → `distribution`; read P50/P80 → `distribution`; check which
     paths set the finish → `criticality`; add runs until P80 holds; commit →
     `convergence`.

2. **Verify each lesson in the browser** (`pnpm dev`): every term lights
   something on its beat; predict reveals are correct for the engine values;
   whys open and close; recap steps jump; no beat body exceeds two sentences;
   existing controls, hover states and playback behave as before; reduced
   motion still reads.

3. **Run** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Acceptance criteria

- [x] AC1: `cpm`: terms `es-ef, merge, ls-lf, float, critical-path, opening` each light a `[data-spot]` element; hovering a node during the forward reveal shows `max {es}` with its predecessors' EF emphasised, and during the backward reveal `min {lf}` with its successors' LS; three predicts (`network`, `forward`, `critical`) compute their answers from `computeCriticalPath`; whys on `forward`, `backward`, `sandbox`; a six-step recap.
- [x] AC2: `pert`: the ranges layout shows `o` and `p` numbers, the bell shows a σ bracket, the widen beat shows variance shares; terms `o, m, p, tail, expected, sigma, deadline, shade` light elements; three predicts (`ranges`, `expected`, `widen`) compute from `expected()`, `probabilityBy()` and `variance()`; whys on `expected`, `project`, `commit`; a six-step recap.
- [x] AC3: `monte-carlo`: stream totals print during a roll and the longest is emphasised; PERT, P50 and P80 readouts and the PERT marker first appear on `distribution`; terms `estimate, longest, roll, bins, p50, p80, pert, streams, share, speakers, estimate, band, runs` light elements; three predicts (`distribution`, `merge-bias`, `criticality`) compute from `simFor` and `pertTotal`; whys on `roll`, `distribution`, `merge-bias`, `criticality`; a six-step recap.
- [x] AC4: No beat body or why exceeds 40 words; no predict answer appears in its own beat's body; `src/content/teaching.test.ts` passes.
- [x] AC5: All existing controls (Replay, presets, sliders, Roll, batch buttons, streams slider, Rush toggle, runs slider, deadline handle, confidence) still work, and every scene still has one focal change per beat.
- [x] AC6: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
