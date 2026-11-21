# Teaching Depth

## Outcome

Lessons 7 to 9 (`resource-leveling`, `rcpsp`, `critical-chain`) explain their
method carefully. The placement procedure that both leveling and RCPSP rely on
becomes something the learner performs (a Place-next stepper and booking-order
badges), the priority rule names are shown as a rank column instead of bare
acronyms, critical chain gains a beat where a feeding buffer visibly absorbs a
delay, and every lesson gets spotlight terms, predicts, whys and a recap.
Every existing interaction stays.

The three lessons are independent. Step 1 may be done for all three
concurrently. "Min LST" is spelled out once per lesson as "latest start first
(Min LST)" and both lessons use that same label.

## Step-by-step

1. **Per lesson** (independent; do all three):

   **1a. `resource-leveling`** (`src/content/lessons/resource-leveling.tsx`, `src/engine/resource-leveling/level.ts`, `src/scenes/resource-leveling/{scene,gantt,lanes}.tsx`)
   - Engine: `level()` additionally returns `order: string[]`, the sequence in
     which tasks were booked (keep the schedule shape; add the field). Pin it
     in `level.test.ts` for the Min LST and shortest rules.
   - Scene tags: `lanes.tsx` tags each lane `useSpot("person-day")`, the
     capacity line group `useSpot("capacity")`, overload blocks
     `useSpot("overload")`; `scene.tsx` tags the end line `useSpot("end")`
     and the "End day" readout `spot="end"`; `gantt.tsx` tags float outlines
     `useSpot("float")` and prints the float number at the outline's right
     end; on `level` and `rule` it draws a small booking-order badge (1 to 8)
     at each bar's left edge (`useSpot("order")`); on `rule` it shows a rank
     column beside each row label (`CPM_ROWS[id].ls` for Min LST, `t.days`
     for Shortest, header "LST" or "days", `useSpot("lst")`) and outlines the
     task booked first.
   - Scene state: `float` opens with `floatOn: false` (per-beat initial
     state) so the predict is answered by flipping the toggle.
   - Copy: `overbooked` body "Every task starts as early as its dependencies
     allow. Each <Term id="person-day">lane block</Term> is one person-day;
     blocks above the <Term id="capacity">headcount line</Term> are
     <Term id="overload">hatched</Term>: {peak('designer')} designers on
     {overDays('designer')}, {peak('developer')} developers on
     {overDays('developer')}." (titles are plain strings, so the `end` term goes in
     the `level` body on "ends on day {leveled}"). `float` wraps "float" in `<Term id="float">` and drops
     the "so {withinOver} overloaded days remain" clause. `level` wraps "most
     urgent task first" in `<Term id="order">`. `rule` wraps "latest start
     first (Min LST)" in `<Term id="lst">` and drops "and the plan ends on
     day {shortest}". `try` title "Try it: buy back time with people." body
     "Drag a bar, or focus it and use the arrow keys; later work is pushed.
     Change headcounts and compare the end day."
   - Predicts: on `float`: "Can sliding tasks inside their float clear every
     overload?" Yes / No, answer No, why "Y1 can wait only {CPM_ROWS.Y1.float}
     days, but the designer is on X1 until day {EARLY.X1.end}." On `rule`:
     "Shortest-first books small tasks first. Will the plan end sooner or
     later than day {leveled}?" Sooner / Same day / Later, answer Later, why
     "Day {shortest}: Design X waits until day {shortestX1Start}, and X has no
     float." On `try`: "Add a second designer: does the end return to day
     {earlyEnd}, the plan that ignores people?" Yes / No, answer Yes, why
     "{twoDesigners} days: every task fits inside its float. One developer
     instead pushes it to {oneDeveloper}."
   - Whys: `float` "Leveling slides the task with the most float first,
     because it can move furthest without touching the end." `level`
     "Starting a task after its latest start pushes the end by the same
     amount. Y1's latest start is day {CPM_ROWS.Y1.ls}; the designer is free
     on day {LEVELED.Y1.start}." `rule` "LST is the latest start: the last day
     a task can begin without moving the end. Booking the smallest LST first
     protects the tasks with the least room."
   - Recap: schedule every task early; plot each role's load against
     headcount → `overbooked`; slide the tasks with the most float first →
     `float`; if overloads remain, book tasks one at a time on the earliest
     day with room → `level`; use latest start first as the rule → `rule`;
     compare adding people with accepting the later end → `try`.

   **1b. `rcpsp`** (`src/content/lessons/rcpsp.tsx`, `src/engine/rcpsp/sgs.ts`, `src/scenes/rcpsp/{scene,gantt,lanes,distribution,rules}.tsx`)
   - Engine: add `serialSgsTrace(tasks, capacities, rule)` beside `serialSgs`
     returning `{ order: string[]; placed: Schedule[] }` where `placed[k]` is
     the partial schedule after `k` placements (same algorithm, recorded).
     Export `ruleKey` so the scene can show each task's rank value. Pin the
     trace order for the latest-start rule in `rcpsp.test.ts`.
   - Scene: `rule` beat becomes a Place-next stepper: it opens with 0 placed;
     unplaced bars are faint outlines at their CPM spot; lanes count only
     placed tasks; controls "Place next task", "Place all", Reset; readout
     "Placed n of 7". Each click springs one bar to the first day its people
     are free (one focal change per click). `rule`, `rules` and `try` show a
     rank column beside each id (value under the selected rule with header
     LST / succ. / days / p-days / days / #, `useSpot("rank")`) and outline
     the task picked first. Hovering or focusing a row label keeps that row
     and its dependency rows bright and dims the rest (`useSpot("deps")` on
     rows that have predecessors). Add `data-task`, `data-lane`,
     `data-overload`, `data-cap`, `data-span` and, in `distribution.tsx`,
     `data-lower-bound`, `data-best`, `data-rule`, `data-hist`; tag them with
     `useSpot("overload" | "programmer" | "capacity" | "lower-bound" | "best" | "rule-dots")`.
     Label the strip's tick axis "days", the lower-bound line "people-free",
     the selected dot with `RULE_LABEL[selected]`, and show histogram bar
     counts on hover or focus with an "orders" axis label.
   - Copy: `cpm` wraps "dependencies" in `<Term id="deps">`, "hatched block"
     in `<Term id="overload">`, "programmers" in `<Term id="programmer">`,
     "the team has {CAPACITIES.programmer}" in `<Term id="capacity">`, and adds
     "the artist is double-booked too" within 40 words. `rule` wraps "latest
     start first (Min LST)" in `<Term id="rank">` and tells the learner to
     press Place next. `rules` wraps "priority rule" in
     `<Term id="rule-dots">`. `search` wraps "{base.duration}-day lower
     bound" in `<Term id="lower-bound">` and "{search.best.makespan} days" in
     `<Term id="best">`.
   - Predicts: on `rules`: "Which rule finishes soonest here?" Latest start /
     Longest / Shortest, answer Latest start, why "{ruleDays[0]} days, tied
     with Successors; Shortest and List order are worst at
     {max(ruleDays)}." On `search`: "Of all {search.evaluated} orders, how
     many reach the best schedule?" Most / About one in eight / Only one,
     answer computed from `search.histogram`, why "{count} orders tie at
     {best} days; most land at {mode}." On `try`: "One extra hire: which
     shortens the best plan more?" A third programmer / A second artist /
     Both the same, answer computed from `exhaustive(GAME_JAM, {3,1})` and
     `{2,2}`, why "Best drops to {a}; a second artist leaves it at {b}."
   - Whys: `rule` "A task's latest start is the last day it can begin and
     still finish by day {base.duration}. The smallest has the least room to
     wait, so it gets people first." `rules` "A rule ranks tasks before seeing
     how they collide. Latest start books Level 1 first, so Engine setup,
     which needs both programmers, waits until day {bStart}." `search`
     "Adding a constraint can never shorten a plan, so the people-free
     {base.duration} days is a floor. The gap to {best} is the cost of the
     team size." `try` "Branch-and-bound builds orders task by task and drops
     any partial order whose bound cannot beat the best found, so most of the
     {bigOrders} orders are never tried."
   - Recap: run CPM ignoring people; its length is the lower bound → `cpm`;
     compare each role's daily demand with headcount → `cpm`; pick a rule and
     place tasks one at a time on the first free day → `rule`; try several
     rules; keep the shortest → `rules`; search exactly when small; use a
     solver when large → `search`.

   **1c. `critical-chain`** (`src/content/lessons/critical-chain.tsx`, `src/scenes/critical-chain/{scene,gantt,fever-chart,model}.ts(x)`)
   - New beat `feeding` between `fever` and `try` (six beats). `model.ts`
     adds `OVERRUN_MAX.design = 4`, `CHAIN_SAFETY` (sum of `safe − aggressive`
     over the buffered chain) and the list of chain safeties. `scene.tsx`
     adds `design` to `overruns`, shifts `FEVER_BEAT` / `TRY_BEAT` /
     `VIEW_BY_BEAT`, and on `feeding` mounts a "Design overrun (days)" slider
     (0 to 4) plus Reset, calling `fever(TASKS, { design, pages: 0 })`.
     `gantt.tsx` adds a feeding-consumed hatch (width `min(design, feeding.days)`)
     mirroring the project-buffer hatch. Readouts on `buffers` are ordered
     Chain, Buffer, Committed.
   - Scene tags in `gantt.tsx`: padded bars `useSpot("padded")`, 50% cores
     `useSpot("core")`, chain bars and arrows `useSpot("chain")`, the resource
     link `useSpot("resource-link")`, the float marker `useSpot("float")`,
     feeding buffer `useSpot("feeding-buffer")`, project buffer
     `useSpot("project-buffer")`, the committed line `useSpot("commit")`, the
     lane clash hatch `useSpot("clash")`, consumed hatch `useSpot("consumed")`.
     In `fever-chart.tsx` tag band polygons `useSpot("zone-ok" | "zone-watch" | "zone-act")`
     and the y-axis title `useSpot("consumed")`. Readouts: "Committed date"
     `spot="commit"`, "Buffer" `spot="project-buffer"`.
   - Copy: `padding` wraps "pale bar" (`padded`), "50% core" (`core`),
     "critical path" (`chain`), "the one developer" (`clash`). `chain` wraps
     "critical chain" (`chain`), "dashed resource link" (`resource-link`),
     "{floatDays} days of float" (`float`). `buffers` body "Plan on the 50%
     cores and pool the removed safety: a <Term id="project-buffer">{HALF.project.days}-day
     project buffer</Term> at the end, a <Term id="feeding-buffer">{feeding.days}-day
     feeding buffer</Term> where Design feeds Pages. We <Term id="commit">commit
     to day {COMMITTED.half}</Term>, not {SAFE.makespan}." `fever` body
     "Report CMS late; the point plots buffer used against chain done.
     <Term id="zone-watch">Watch</Term> means plan a response,
     <Term id="zone-act">Act</Term> means take it. Nobody re-plans the dates."
     `feeding` title "Feeding buffers absorb side-path delays." body "Make
     Design late. Up to {feeding.days} days it only fills the feeding buffer;
     one more day eats {pct(bufferUsedAt(feeding.days + 1))} of the project
     buffer." `try` body "Switch Project buffer sizing to Root-sum-square,
     then push both overruns and watch the zone."
   - Predicts: on `fever`: "CMS finishes {firstCmsOverrun('yellow')} days late.
     Which zone?" OK / Watch / Act, answer Watch, why "{pct(bufferUsed)} of the
     buffer is gone with only {pct(chainComplete)} of the chain done." On
     `feeding`: "Design finishes 2 days late. How much project buffer does it
     use?" None / 1 day / 2 days, answer None, why "The {feeding.days}-day
     feeding buffer sits before Pages, which still starts on day
     {PLAN.start.pages}." On `try`: "Will Root-sum-square give a bigger or
     smaller buffer than Half here?" Smaller / Bigger / Same, answer from
     `RSS.project.days` versus `HALF.project.days` (Bigger), why
     "{RSS.project.days} vs {HALF.project.days} days: Pages' cut dominates."
   - Whys: `padding` "A 50% estimate is one you'd beat half the time. Padding
     rarely comes back: work expands to fill the estimate and early finishes go
     unreported." `chain` "Pages waits for the developer to finish CMS on day
     {SAFE.finish.cms}, not for Design on day {SAFE.finish.design}. That
     hand-off is a link, so the longest path runs through it." `buffers`
     "Tasks rarely all overrun, so one shared buffer covers the chain's total
     slip with less than the {CHAIN_SAFETY} days it replaces." `fever` "Early
     on, little buffer should be gone; near the end nearly all of it may be.
     So the Watch and Act lines rise as the chain completes." `try`
     "Root-sum-square, √(sum of squared cuts) rounded up, assumes overruns are
     independent: one big cut counts heavily, small cuts barely add."
   - Recap: get a padded and a 50% estimate per task → `padding`; resolve
     resource clashes; the longest path through both link types is the chain
     → `chain`; plan on the cores; pool the cut safety into a project buffer
     → `buffers`; put a feeding buffer where a side path joins → `feeding`;
     track buffer used against chain done; act in the Act zone → `fever`.

2. **Verify in the browser** (`pnpm dev`) for all three: the stepper places
   one bar per click; rank columns and badges match the engine; the feeding
   hatch grows with the Design slider and the project buffer stays untouched
   up to {feeding.days}; every term lights something; predicts reveal
   engine-derived answers; recap jumps; drag and keyboard moves, rule
   switches, Search, capacity segments, overrun sliders and buffer sizing all
   still work; 375 px still shows the canvas.

3. **Run** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Acceptance criteria

- [x] AC1: `level()` returns the booking `order` (pinned in tests); the leveling Gantt shows float numbers on `float`, booking badges on `level` and `rule`, and a rank column on `rule`; terms `end, person-day, capacity, overload, float, order, lst` light elements; predicts on `float` (toggle starts off), `rule`, `try`; whys on `float`, `level`, `rule`; a five-step recap.
- [x] AC2: `serialSgsTrace` exists and is pinned in tests; the rcpsp `rule` beat is a Place-next stepper with "Placed n of 7", "Place next task", "Place all" and Reset; rank columns show the selected rule's values; row hover dims non-dependency rows; terms `deps, overload, programmer, capacity, rank, rule-dots, lower-bound, best` light elements; predicts on `rules`, `search`, `try` compute from `exhaustive` and the histogram; whys on `rule`, `rules`, `search`, `try`; a five-step recap.
- [x] AC3: `critical-chain` has six beats `padding, chain, buffers, fever, feeding, try`; `feeding` mounts a Design overrun slider whose first {feeding.days} days hatch only the feeding buffer; the fever copy names Watch and Act (not colours); readouts on `buffers` read Chain, Buffer, Committed; terms `padded, core, chain, clash, resource-link, float, project-buffer, feeding-buffer, commit, zone-watch, zone-act` light elements; predicts on `fever`, `feeding`, `try` compute from `fever()` and the buffer models; whys on `padding`, `chain`, `buffers`, `fever`, `try`; a six-step recap.
- [x] AC4: No beat body or why exceeds 40 words; no predict answer appears in its own beat's body; `src/content/teaching.test.ts` passes.
- [x] AC5: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
