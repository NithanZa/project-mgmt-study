# PM Methods Interactive Course

## Outcome

Lesson 9, Critical Chain (CCPM), is complete at `/learn/critical-chain`. The
learner plans a website redesign with one developer, sees that the chain of
work follows the developer rather than the dependency arrows, strips the
padding out of every estimate into shared buffers, and manages the project by
watching buffer consumption on a fever chart. Insight: the longest dependency
chain is not the bottleneck when people are shared; schedule the
resource-constrained chain and protect it with buffers.

Scenario (days). Safe estimates are what people give; aggressive estimates
are 50% confidence. One developer. Verified.

| task      | safe | aggressive | after          | resource  |
| --------- | ---- | ---------- | -------------- | --------- |
| Copy      | 5    | 3          |                | writer    |
| Design    | 8    | 5          |                | designer  |
| Pages     | 10   | 6          | Design         | developer |
| CMS       | 6    | 4          | Copy           | developer |
| Integrate | 4    | 2          | Pages, CMS     | developer |
| Launch    | 1    | 1          | Integrate      | manager   |

Safe critical path (no resource limits): Design → Pages → Integrate → Launch,
23 days, infeasible because Pages and CMS both need the developer. Best
resource-feasible safe schedule: 26 days with CMS before Pages (Copy 0–5,
Design 0–8, CMS 5–11, Pages 11–21, Integrate 21–25, Launch 25–26). The critical
chain is Copy → CMS → Pages → Integrate → Launch, joined by the resource link
CMS → Pages; Design now has 3 days of float. With aggressive estimates the
chain is 16 days (Copy 0–3, CMS 3–7, Design 0–5, Pages 7–13, Integrate 13–15,
Launch 15–16). Safety removed along the chain: 2 + 2 + 4 + 2 + 0 = 10, so the
project buffer is 5 (half) and the committed date is 21. Design feeds Pages
with 3 days of safety removed, so its feeding buffer is 2 and Design 0–5 plus
buffer 5–7 lands exactly at Pages' start. Root-sum-square sizing gives
√(4 + 4 + 16 + 4) ≈ 5.3, rounded to 6.

## Step-by-step

1. **Engine** `src/engine/critical-chain/`:
   - `types.ts`: `Task { id; name; safe; aggressive; deps; resource }`,
     `Mode = "safe" | "aggressive"`, `Schedule`.
   - `fixture.ts`: `REDESIGN: Task[]`, `CAPACITIES` (one of each).
   - `schedule.ts`: `cpm(tasks, mode)`, `bestFeasible(tasks, mode): Schedule`
     (exhaustive over the 720 priority orders through a serial schedule
     generator, memoised), `chain(tasks, schedule): { ids: string[]; links: { from; to; kind: "dependency" | "resource" }[] }`
     (longest path where an edge exists for a dependency or for two tasks on
     the same resource scheduled back to back),
     `buffers(tasks, schedule): { project: { days; method: "half" | "rss" }; feeding: { before: string; from: string; days }[] }`,
     `committedDate`.
   - `fever.ts`: `fever(tasks, overruns: Record<id, number>): { chainComplete; bufferUsed; zone }`
     where overruns extend aggressive durations, `bufferUsed = overrunOnChain / projectBuffer`,
     `chainComplete = chain days finished / chain days`, and
     `zone = "red" if bufferUsed > 0.4 + 0.5 × chainComplete, "yellow" if > 0.15 + 0.5 × chainComplete, else "green"`.
   - `critical-chain.test.ts`: safe CPM 23; `bestFeasible` safe 26 with the
     starts above; chain ids and the CMS → Pages resource link; aggressive
     chain 16; project buffer 5 (half) and 6 (rss); feeding buffer 2 before
     Pages; `fever` with no overruns is green at 0; CMS overrun 2 is yellow;
     CMS overrun 4 is red.

2. **Scene** `src/scenes/critical-chain/`:
   - `gantt.tsx`: six rows, 0 to 30-day axis; each bar has an outer safe
     extent and an inner aggressive core; chain bars in `accent`; dependency
     arrows solid, the resource link CMS → Pages dashed in `accent`; buffers as
     `buffer`-coloured blocks (project buffer after Launch, feeding buffer
     between Design and Pages) that grow in with `layout`.
   - `fever-chart.tsx`: x chain complete, y buffer used, three zone bands,
     a `motion.circle` that springs between points, and a trail.
   - `scene.tsx`: state `{ mode, overruns, bufferMethod }`; readouts
     "Committed date", "Chain", "Buffer". Controls: overrun sliders for CMS
     (0 to 4) and Pages (0 to 6) (beats 4 and 5), buffer method `Segmented`
     half / root-sum-square (beat 5), Reset.
   - `thumbnail.tsx`: static Gantt with chain and buffers.

3. **Beats** in `src/content/lessons/critical-chain.tsx`:
   1. *Everyone pads, and the padding gets used anyway.* Safe bars with
      aggressive cores visible; the critical path reads 23 but the developer
      lane shows the clash.
   2. *The chain follows people, not only arrows.* The feasible schedule
      settles at 26; the chain lights through Copy → CMS → Pages with the
      dashed resource link; Design shows float.
   3. *Cut the padding, pool the safety.* Bars shrink to their cores; the
      project buffer of 5 appears after Launch and the feeding buffer of 2
      before Pages; committed date 21 instead of 26.
   4. *Manage the buffer, not the dates.* Fever chart: CMS overrun 2 is
      yellow, 4 is red; the chart answers "do we act?" without re-planning.
   5. *Try it: overruns and buffer sizing.* Both sliders; root-sum-square
      sizes the buffer at 6.
   Check: "Where does a feeding buffer go?" options at the end of the project /
   where a non-chain path joins the chain / before every task, answer the
   second, why: it protects the chain from late inputs.

4. **Register**, verify in the browser (the bar shrink in beat 3 keeps the
   axis fixed; the fever point springs; zones are legible without colour via
   labels), commit (`feat(lesson): critical chain`), push.

## Acceptance criteria

- [ ] AC1: Engine tests pass for safe CPM 23, feasible safe 26, aggressive chain 16, buffers 5 / 6 and 2, and the fever zones listed.
- [ ] AC2: Beat 2 shows the chain Copy → CMS → Pages → Integrate → Launch with a dashed resource link and Design with 3 days of float.
- [ ] AC3: Beat 3 shows the committed date 21, a 5-day project buffer after Launch and a 2-day feeding buffer ending exactly at Pages' start.
- [ ] AC4: In beat 4 the fever point is green with no overrun, yellow at CMS overrun 2 and red at 4.
- [ ] AC5: Beat 5's buffer method control changes the project buffer to 6 and the committed date to 22.
- [ ] AC6: Scene `aria-label` reports mode, committed date and fever zone; the lesson meets the phase 1 quality bar.
- [ ] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
