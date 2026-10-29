# PM Methods Interactive Course

## Outcome

Lesson 13, Value Stream Mapping, is complete at `/learn/vsm`. The learner maps
a hiring process, sees that candidates spend 24 of 25 days waiting, names the
waste behind each wait, designs a future state, and discovers that speeding up
the work itself barely moves the lead time. Insight: most lead time is waiting,
handoffs and batching, so map the stream and remove the waits first.

Scenario. Process time in hours (8-hour days), wait before each step in days.
Verified.

| step          | process h | wait before (d) | why it waits                                  |
| ------------- | --------- | --------------- | --------------------------------------------- |
| Resume screen | 0.5       | 3               | screened in a weekly batch                    |
| Phone screen  | 1         | 4               | calendar ping-pong between recruiter and hiring manager |
| Take-home     | 4         | 5               | candidate has a week; reviewers pick it up late |
| Onsite        | 5         | 7               | five interviewers' calendars must align       |
| Debrief       | 1         | 2               | waits for the next team meeting               |
| Offer         | 0.5       | 3               | approval chain                                |

Current state: lead time 25.5 days, process time 1.5 days (12 h), process
cycle efficiency 5.9%. Future state A (take-home wait 1, onsite scheduled
within 2 days, same-day debrief, offer approval 1 day): 12.5 days, 12%. Future
state B (A plus both screens within 1 day): 7.5 days, 20%. Cutting the onsite
from 5 h to 2 h moves the current lead time from 25.5 to 25.1 days.

## Step-by-step

1. **Engine** `src/engine/vsm/`:
   - `types.ts`: `Step { id; name; processHours; waitDays; waste: "batching" | "handoff" | "waiting" | "approval" }`,
     `Improvement { id; label; apply(steps): Step[] }`.
   - `fixture.ts`: `HIRING: Step[]`, `IMPROVEMENTS` (`takeHomeFastReview`,
     `onsiteWithinTwoDays`, `sameDayDebrief`, `offerApprovalOneDay`,
     `screensWithinOneDay`), `HOURS_PER_DAY = 8`.
   - `vsm.ts`: `summary(steps): { leadTimeDays; processDays; efficiency; waitDays }`,
     `applyImprovements(steps, ids)`, `withProcessHours(steps, id, hours)`.
   - `vsm.test.ts`: current 25.5 / 1.5 / 5.9%; future A 12.5 / 12%; future B
     7.5 / 20%; onsite at 2 h gives 25.1; improvements never produce negative
     waits; applying an improvement twice is idempotent.

2. **Scene** `src/scenes/vsm/`:
   - `map.tsx`: the classic value stream layout: six process boxes in a row,
     each with a data box (process time), inventory triangles between them
     showing the wait in days with a small stack of "candidate" chips sized to
     the wait, and a timeline ladder underneath (waits low and wide in
     `constraint`, process steps high and thin in `accent`, widths
     proportional to time on a shared scale, animated with `layout`); totals
     at the right (lead time, process time, efficiency).
   - `waste-callout.tsx`: hovering or focusing a triangle shows the waste type
     and the "why it waits" line.
   - `future-state.tsx`: toggles for the five improvements with the ladder
     shrinking live; a before / after pair of totals.
   - `scene.tsx`: state `{ improvements: Set<id>, onsiteHours }`; readouts
     "Lead time", "Process time", "Efficiency". Controls: improvement toggles
     (beats 4 and 5), onsite hours slider 1 to 8 (beat 5), Reset.
   - `thumbnail.tsx`: static ladder.

3. **Beats** in `src/content/lessons/vsm.tsx`:
   1. *Map every step and every wait.* The map draws left to right; totals
      count to 25.5 days and 12 hours.
   2. *Most of the lead time is waiting.* The ladder: 24 days low, 1.5 days
      high; efficiency 5.9%.
   3. *Name the waste behind each wait.* Hover the triangles: batching,
      handoffs, calendar alignment, approvals.
   4. *Design the future state.* Toggle four improvements: 12.5 days and 12%;
      add the screens: 7.5 days and 20%.
   5. *Try it: speeding up the work barely moves the date.* Onsite 5 h → 2 h
      moves the current lead time from 25.5 to 25.1 days; the waits are the
      lever.
   Check: "Process cycle efficiency is…" options lead time ÷ process time /
   process time ÷ lead time / waits ÷ steps, answer the second, why: the share
   of elapsed time that adds value.

4. **Register**, verify in the browser (the ladder keeps one scale across
   toggles so widths are comparable; callouts are keyboard reachable; totals
   animate with the readout component), commit
   (`feat(lesson): value stream mapping`), push.

## Acceptance criteria

- [x] AC1: `vsm.test.ts` passes for current, future A, future B and the onsite variant.
- [x] AC2: Beat 1's totals read 25.5 days lead time and 12 h process time; beat 2's ladder shows wait segments summing to 24 days.
- [x] AC3: Every inventory triangle exposes its waste type and reason on hover and on keyboard focus.
- [x] AC4: Beat 4's toggles show 12.5 days / 12% with four improvements and 7.5 days / 20% with all five; Reset restores 25.5.
- [x] AC5: Beat 5's onsite slider at 2 h shows 25.1 days with no improvements on.
- [x] AC6: Scene `aria-label` reports lead time, process time and efficiency; the lesson meets the phase 1 quality bar.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
