# Teaching Depth

## Outcome

Lessons 10 to 13 (`toc`, `dbr`, `kanban`, `vsm`) explain their method
carefully. The readout words (throughput, cycle time, WIP) are defined by
pointing at them; the visual codes (capacity dial, busy bar, buffer gauge,
starved strip, cumulative flow diagram, VSM triangles and ladder) are each
explained by a spotlight or a reading beat; TOC's exploit and subordinate get
one beat each; kanban gets a CFD reading beat before Little's law; VSM's work
beat resets improvements so its numbers match. Every lesson gets predicts,
whys and a recap. Every existing interaction stays.

The four lessons are independent. Step 1 may be done for all four
concurrently.

## Step-by-step

1. **Per lesson** (independent; do all four):

   **1a. `toc`** (`src/content/lessons/toc.tsx`, `src/scenes/toc/{scene,line,invest-panel,focusing-steps}.tsx`)
   - Split `exploit` into `exploit` (cleaning toggle only; title and body as
     today minus the release sentence) and `subordinate` (title "Subordinate:
     feed the oven, not the queue."; body from the release sentence with
     `paced.throughput`, `push.avgCycleTime → paced.avgCycleTime`,
     `push.avgWip → paced.avgWip`; mounts only the "Oven-paced release"
     toggle). Six beats; `BEAT` becomes
     `{ identify: 1, exploit: 2, subordinate: 3, elevate: 4, repeat: 5 }`;
     `controlsFor` splits; `focusing-steps.tsx` `FOCUS` becomes
     `{1:[0,1], 2:[1,1], 3:[2,1], 4:[3,1], 5:[4,1]}`. Focal change on
     `subordinate`: the oven pile drains when the toggle is on.
   - Scene tags in `line.tsx`: `Dial` wrappers `useSpot("capacity")` with a
     visible "/h" unit label under each dial (drop the sr-only text); the
     Market column `useSpot("orders")`; the oven `Pile` `useSpot("pile")`
     and every pile also `wip`; the Pack batch bar `useSpot("throughput")`;
     the oven tile, ring and tag `useSpot("constraint")`; every `Busy` bar
     `useSpot("busy")`; the Market batch bar `useSpot("release")`. In
     `invest-panel.tsx` the Oven button `useSpot("elevate")`. On `repeat`,
     selectable tiles show a hover/focus outline. Readouts: Throughput
     `spot="throughput"`, Cycle time `spot="cycle-time"`, WIP `spot="wip"`.
   - Copy: `pace` wraps "{DEMAND} an hour" (`orders`), "loaves come out"
     (`throughput`), "piles up" (`pile`) and adds "each dial is capacity an
     hour" with `<Term id="capacity">`. `identify` wraps "constraint"
     (`constraint`) and "busy" (`busy`). `subordinate` wraps "Releasing"
     (`release`), "cycle time" (`cycle-time`), "WIP" (`wip`). `elevate` wraps
     "oven" (`elevate`). `repeat` tells the learner to click a tile to pick
     the station the slider changes.
   - Predicts: on `subordinate`: "Release dough only as fast as the oven
     bakes. Output will…" fall / stay at {one(push.throughput)} / rise,
     answer stay, why "The oven was already the limit; extra dough only
     waited." On `elevate`: "Proof gets +50% capacity. Bakery output rises
     by…" 0 / about {investDeltas().oven} an hour / +50%, answer 0, why
     "Proof was never the limit; the oven still bakes {ovenCapacity} an hour."
   - Check changes to "Doubling the oven moves the constraint to…" Proof /
     The market / Pack, answer from `doubled.constraint === MARKET` (The
     market), why "Demand is now below every station's capacity."
   - Whys: `exploit` "The oven has no spare hours, so any hour it loses is
     lost to the whole bakery. Stations with slack can recover a lost hour;
     the constraint can't." `subordinate` "Every loaf released early just
     queues before the oven, adding hours to cycle time. Every other station
     has slack, so pacing to the oven costs nothing." `repeat` "With the oven
     at {doubledOvenCapacity}, every station can make more than the {DEMAND}
     orders an hour. Demand now limits output."
   - Recap: find where work piles up: the constraint → `identify`; stop
     losing constraint time → `exploit`; release work at the constraint's
     pace → `subordinate`; only then add capacity at the constraint →
     `elevate`; check where the constraint moved; repeat → `repeat`.

   **1b. `dbr`** (`src/content/lessons/dbr.tsx`, `src/scenes/dbr/{scene,shop,buffer-gauge,sweep-chart,rope}.tsx`)
   - Scene tags: `shop.tsx` `DrumParts` `useSpot("drum")`, the filled pips
     `useSpot("consumed")`, Weld's pile `useSpot("pile")`, the Cut and Weld
     piles together with the gauge `useSpot("buffer")`, the gate
     `useSpot("gate")`; `rope.tsx` path `useSpot("rope")`; `buffer-gauge.tsx`
     adds the label "Cut+Weld" under the gauge and tags the "!" group
     `useSpot("starved")`; the playback starved strip `useSpot("starved")`;
     `sweep-chart.tsx` tags the busy path `useSpot("busy-line")`, the cycle
     path `useSpot("cycle-line")`, adds a `knee?: number` prop drawing a ring
     at that x on the busy path (`useSpot("knee")`, shown on `insured` and
     `try`) and an x-axis label "buffer target, items". The Variability
     slider wrapper gets `data-spot="noise"`.
   - Copy: `push` wraps "Weld, the drum" (`drum`), "items wait" (`pile`);
     the title wraps "rope" (`rope`). `rope` wraps "buffer" (`buffer`),
     "release gate" (`gate`), "what Weld has used" (`consumed`). `starved`
     wraps "swings" (`noise`), "runs dry" (`starved`). `insured` wraps "busy"
     (`busy-line`), "cycle time" (`cycle-line`), "knee" (`knee`). `try` wraps
     "busy line" (`busy-line`).
   - Predict on `starved`: "Capacities now swing daily but average the same.
     Weld's output…" stays {one(roped.throughput)} / falls, answer falls, why
     "Days Weld sits idle can't be made up; it has no spare capacity."
   - Whys: `push` "Weld makes only {weldCapacity} a day, so it sets the pace
     for the whole shop: the drum. Releasing more than that just grows the
     pile." `rope` "Each day the gate releases target minus items already at
     Cut and Weld. Weld still gets all it can weld; orders wait outside,
     where they cost nothing." `insured` "A bigger buffer means more items
     queue, so cycle time keeps rising. Past the knee Weld is almost never
     starved, so extra items buy almost no output."
   - Recap: find the slowest station: the drum → `push`; release work only as
     the drum consumes it → `rope`; expect variation to starve it →
     `starved`; hold a buffer in front of the drum → `insured`; size it at the
     knee → `try`.

   **1c. `kanban`** (`src/content/lessons/kanban.tsx`, `src/scenes/kanban/{scene,board,cfd,sweep-chart}.tsx`)
   - New beat `cfd` before `little` (six beats; `BEAT` adds `cfd`; `panel` is
     "cfd" on both; the slider stays). Title "The flow diagram stacks every
     column over time." Body "Each <Term id="band">band</Term> is one
     column's items, day by day. The top edge counts
     <Term id="arrivals">arrivals</Term>, the dark line counts
     <Term id="done">finished work</Term>." `cfd.tsx` takes `showGaps`
     (false on `cfd`, true on `little`) so `little` has a single focal change:
     the brackets and formula appear. Add end labels "arrived" and "done", a
     y-axis unit "items", keep the legend visible on phones (under the
     chart), and tag bands `useSpot("band")`, a thin top-edge stroke
     `useSpot("arrivals")`, the done line `useSpot("done")`, the WIP bracket
     `useSpot("wip")`, the cycle bracket `useSpot("cycle-time")`, and a short
     slope segment over the last 10 days shown only when lit
     (`useSpot("throughput")`).
   - Board tags in `board.tsx`: all cards plus the WIP readout `wip`; the
     Deploy column plus the Throughput readout `finish`; card ages plus the
     Cycle-time readout `age`; limit chips `limit`; "waiting" bands
     `room` and `blocked`; the Test column hatch `down`. In
     `sweep-chart.tsx` tag `data-limit` points `useSpot("floor" | "starves")`
     for `steady[1].limit` and `noisy[1].limit`, and label the dashed curve
     "no variability" when variability is on.
   - Copy: `push` wraps "crowd the board" (`wip`), "finish" (`finish`), "each
     takes" (`age`). `limit` wraps "at most {LIMIT}" (`limit`), "room"
     (`room`). `little` wraps "vertical gap" (`wip`), "horizontal gap"
     (`cycle-time`), "throughput" (`throughput`). `outage` wraps "stop
     pulling" (`blocked`), "Test down" (`down`). `sweep` wraps "floor"
     (`floor`), "starves" (`starves`).
   - Predicts: on `limit`: "Cap every column at {LIMIT} items. Throughput
     will…" fall / stay at {one(pushEnd.throughput)} / rise, answer stay, why
     "Build still finishes {buildCap} a day; only its queue shrinks."
     (`buildCap` from `BOARD[drumIndex(BOARD)].capacity`). On `outage`: "Test
     stops for {OUTAGE_DAYS} days. Analyse and Build will…" keep starting work
     / fill to {LIMIT} and stop, answer the second, why "Nothing can move into
     a full column."
   - Whys: `push` "Build finishes only {buildCap} a day, so everything behind
     it waits. Starting more doesn't finish more; it only lengthens the
     queue." `limit` "Extra requests wait in the backlog, not on the board,
     and the clock starts when work is pulled. Fewer items in line means each
     waits less." `little` "Items leave at the throughput rate, so the last
     arrival waits for everyone ahead of it: WIP ÷ throughput = days in the
     system." `outage` "The stop is the point: with nothing to start, the team
     helps fix Test instead of hiding the problem under half-done work."
     `sweep` "A column can't finish more than it holds. At limit 1 Build holds
     one item, so it finishes one a day despite capacity {buildCap}."
   - Recap: put each stage of work in its own column → `push`; cap each
     column; pull only when there's room → `limit`; track WIP, throughput and
     cycle time on a CFD → `cfd`; when a column blocks, swarm the blocker →
     `outage`; lower limits until throughput falls, then step back → `sweep`.

   **1d. `vsm`** (`src/content/lessons/vsm.tsx`, `src/engine/vsm/fixture.ts`, `src/scenes/vsm/{scene,map,ladder}.tsx`)
   - Scene: `scene.tsx` clears `improvements` on entering `work` (per-beat
     preset, same pattern as the flow scenes) so the body's numbers hold
     without a manual Reset; Reset stays in its row. `map.tsx` tags process
     boxes `useSpot("steps")`, data boxes `useSpot("work")`, triangles plus
     dots `useSpot("waits")`, the flow line `useSpot("lead-time")`, each
     triangle group `useSpot(waste id)` (`batching`, `handoff`, `waiting`,
     `approval`), and the onsite data box `useSpot("onsite")`. `ladder.tsx`
     tags wait segments `useSpot("wait-rungs")`, work segments
     `useSpot("work-rungs")`, the onsite work rung also `onsite`, the dashed
     baseline `useSpot("baseline")`, the totals `useSpot("pce")`, and adds a
     day scale tick at the right end. `future-state.tsx` chips
     `useSpot("improvements")`. Readouts: Lead time `spot="lead-time"`,
     Efficiency `spot="pce"`. `fixture.ts` relabels `IMPROVEMENTS` to say
     what they cap: "Take-home wait 1 d", "Onsite wait 2 d", "Debrief wait
     0 d", "Offer wait 1 d", "Screen waits 1 d".
   - Copy: `map` wraps "steps" (`steps`), "work" (`work`), "waits" (`waits`),
     "resume to offer" (`lead-time`). `ladder` wraps "waits low"
     (`wait-rungs`), "work high" (`work-rungs`), "process cycle efficiency"
     (`pce`). `waste` wraps "weekly batches" (`batching`), "handoffs"
     (`handoff`), "calendar alignment" (`waiting`), "an approval chain"
     (`approval`). `future` wraps "improvements" (`improvements`) and "falls
     to" (`baseline`). `work` wraps "onsite" (`onsite`).
   - Predict on `future`: "Which cut shortens the hire most?" capping the
     onsite wait at 2 d / halving onsite work, answer the first, why "That
     wait is {onsiteWaitDays} days; the onsite is {hours(ONSITE)}." (read
     `HIRING.find(s => s.id === 'onsite').waitDays`).
   - Whys: `map` "A triangle marks work waiting before a step, one dot per
     day. Work hours become days at {HOURS_PER_DAY} h a day, so both share one
     timeline." `ladder` "The candidate lives through the lead time, not the
     work time. Each waiting day is a day a rival can make an offer."
     `future` "Each cap removes a batch, handoff or approval delay; the work
     itself is unchanged. Biggest waits first gives the most days back."
   - Recap: walk the process; record each step's work time → `map`; record
     the wait before every step → `map`; lay both on a timeline; compute lead
     time and efficiency → `ladder`; name the waste causing each wait →
     `waste`; design a future state that cuts the biggest waits → `future`;
     speed up work last → `work`.

2. **Verify in the browser** (`pnpm dev`) for all four: toc has six beats
   with one toggle each on `exploit` and `subordinate`; kanban's `cfd` beat
   shows the chart without brackets and `little` adds them; vsm's `work` beat
   opens with no improvements on; every term lights something; predicts
   reveal engine-derived answers; recap jumps; playback, sliders, toggles,
   invest panel, Test-down button and improvement chips still work; 375 px
   still shows each canvas.

3. **Run** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Acceptance criteria

- [x] AC1: `toc` has six beats `pace, identify, exploit, subordinate, elevate, repeat`; `exploit` mounts only the cleaning toggle and `subordinate` only the release toggle; dials show a "/h" label; terms `orders, throughput, pile, capacity, constraint, busy, release, cycle-time, wip, elevate` light elements; predicts on `subordinate` and `elevate`; the check asks where the constraint moves; whys on `exploit`, `subordinate`, `repeat`; a five-step recap.
- [x] AC2: `dbr`: the gauge is labelled "Cut+Weld"; the sweep chart marks the knee and labels its x-axis; terms `drum, pile, rope, buffer, gate, consumed, noise, starved, busy-line, cycle-line, knee` light elements; a predict on `starved`; whys on `push`, `rope`, `insured`; a five-step recap.
- [x] AC3: `kanban` has six beats `push, limit, cfd, little, outage, sweep`; the CFD shows "arrived" and "done" end labels and an "items" unit, with brackets and formula only from `little`; terms `wip, finish, age, limit, room, band, arrivals, done, cycle-time, throughput, blocked, down, floor, starves` light elements; predicts on `limit` and `outage`; whys on `push`, `limit`, `little`, `outage`, `sweep`; a five-step recap.
- [x] AC4: `vsm`: entering `work` clears improvements; improvement chips say which wait they cap; terms `steps, work, waits, lead-time, wait-rungs, work-rungs, pce, batching, handoff, waiting, approval, improvements, baseline, onsite` light elements; a predict on `future`; whys on `map`, `ladder`, `future`; a six-step recap.
- [x] AC5: No beat body or why exceeds 40 words; no predict answer appears in its own beat's body; `src/content/teaching.test.ts` passes.
- [x] AC6: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
