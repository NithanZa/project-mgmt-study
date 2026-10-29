# PM Methods Interactive Course

## Outcome

Lesson 4, Fast Tracking, is complete at `/learn/fast-tracking`. The learner
builds a house in four sequential phases, drags a phase to start before its
predecessor ends, and sees the saving, the rework risk, and the sweet spot
where more overlap stops paying. Insight: overlapping sequential work buys time
only up to a point, because starting on unfinished input risks redoing it.

Scenario (days). Design 20 → Foundations 15 → Framing 20 → Interior 25.
Sequential duration 80. Overlap model for an edge with predecessor length `p`
and overlap `o` days: the successor starts `o` days before the predecessor
ends; the chance that the overlapped work must be redone is `o / p` and the
redo costs `o` days, so expected rework is `o² / p` and the expected net saving
is `o - o² / p`, which peaks at `o = p / 2`. Verified: Design → Foundations net
saving 1.8 / 3.2 / 4.2 / 4.8 / 5.0 / 4.8 / 4.2 / 3.2 / 1.8 / 0 at overlaps 2 /
4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20. Overlaps (10, 7.5, 10) give the best
expected duration 66.25 (saved 27.5, rework 13.75); (5, 4, 5) give 69.6;
(19, 14, 19) give 77.2.

## Step-by-step

1. **Engine** `src/engine/fast-tracking/`:
   - `types.ts`: `Phase { id; name; days }`, `Overlaps = [number, number, number]`
     (Design→Foundations, Foundations→Framing, Framing→Interior).
   - `fixture.ts`: `HOUSE: Phase[]`, `MAX_OVERLAP = [19, 14, 19]` (predecessor
     length minus one).
   - `schedule.ts`: `schedule(overlaps): { bars: { id; start; end }[]; planned; expectedRework; expected; edges: { saved; risk; expectedRework; net }[] }`,
     `netCurve(edgeIndex): { overlap; net }[]` in 0.5-day steps,
     `bestOverlaps(): Overlaps` by grid search in 0.5-day steps,
     `clampOverlap(edgeIndex, value)`.
   - `schedule.test.ts`: sequential 80; the sweep values above; `bestOverlaps`
     is (10, 7.5, 10) with expected 66.25 ±0.01; the two preset values;
     overlaps never exceed `MAX_OVERLAP`.

2. **Scene** `src/scenes/fast-tracking/`:
   - `gantt.tsx`: four bars on a 0 to 90-day axis. The three successor bars are
     draggable along x (`drag="x"`, `dragMomentum={false}`, `dragElastic={0}`,
     `dragConstraints` from `MAX_OVERLAP`, snapping to whole days on release
     through `onDragEnd`). The overlapped region is hatched in `buffer`; the
     expected rework draws as a dotted extension at the end of the successor;
     the planned finish and the expected finish are two markers on the axis.
     Arrow keys move the focused bar by one day; Shift+arrow by five.
   - `net-curve.tsx`: the parabola for the active edge with the current point
     sliding along it.
   - `risk-meters.tsx`: three small meters (risk %, expected rework days).
   - `scene.tsx`: state `overlaps`; readouts "Planned finish", "Expected finish",
     "Risk of rework" for the active edge. Controls: presets `Segmented`
     (Sequential, Balanced = best, Max overlap) and Reset (beats 4 and 5).
   - `thumbnail.tsx`: static four-bar Gantt with one overlap hatched.

3. **Beats** in `src/content/lessons/fast-tracking.tsx`:
   1. *Finish-to-start is safe and slow.* Four bars end to end, 80 days.
   2. *Drag Foundations to start before Design ends.* The bar is pulsing
      lightly as an affordance; at 10 days the readouts show saved 10, risk
      50%, expected rework 5, net 5.
   3. *Every overlap has a sweet spot.* The net curve appears for the active
      edge; dragging past 10 days makes the point slide back down.
   4. *Overlap everything and you gain almost nothing.* Presets: Max overlap
      gives 77 expected days, Balanced gives 66.
   5. *Try it: find your own balance.* Drag all three; meters live.
   Check: "You overlap a 20-day predecessor by 10 days. Expected rework?"
   options 2.5 / 5 / 10 days, answer 5, why: 50% chance of redoing 10 days.

4. **Register**, verify in the browser (drag snaps to days, keyboard moves bars,
   expected finish marker springs rather than jumps, no horizontal page scroll
   during drag on mobile: use `touch-action: pan-y` on the panel), commit
   (`feat(lesson): fast tracking`), push.

## Acceptance criteria

- [x] AC1: `schedule([0,0,0]).expected` is 80, `schedule([10,7.5,10]).expected` is 66.25 ±0.01, `schedule([19,14,19]).expected` is 77.17 ±0.01, and `bestOverlaps()` returns (10, 7.5, 10).
- [x] AC2: Dragging Foundations 10 days left in beat 2 shows saved 10, risk 50%, rework 5 and an expected finish of 75.
- [x] AC3: Beat 3's curve point reaches its maximum at 10 days and moves down on both sides.
- [x] AC4: Presets in beat 4 animate the bars and show 77 and 66 expected days.
- [x] AC5: Bars can be moved with arrow keys and the page does not scroll horizontally while dragging on a 375 px viewport.
- [x] AC6: Scene `aria-label` reports the three overlaps and the expected finish; the lesson meets the phase 1 quality bar.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
