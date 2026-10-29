# PM Methods Interactive Course

## Outcome

Every lesson is verified against the phase 1 quality bar by someone other than
its author (a review pass), accessibility and performance are measured and
fixed, an end-to-end smoke test walks all 13 lessons, the Motion reviewer agent
has audited every scene, the copy has had a final edit, and the repository is
ready to deploy from GitHub.

## Step-by-step

1. **Copy pass.** Read every beat of every lesson aloud in order. Enforce the
   quality bar: title at most eight words and a takeaway; body at most two
   sentences and forty words; no term before the scene shows it; every number
   read from the engine. Replace any hedging, any "simply", any sentence that
   starts with "This". Check each `check.why` explains in one clause.

2. **Scene review pass.** For each lesson, one beat at a time, confirm: one
   focal change; the canvas never remounts (mount log); readouts top-right and
   controls bottom; controls mount only when used; nothing animates longer
   than 600 ms except playback; reduced-motion mode still communicates the
   change through position and text. Record findings in
   `docs/plan/review-log.md` (lesson, beat, finding, fix commit) and fix them.

3. **Motion audit.** Run the installed `motion-reviewer` agent
   (`.claude/agents/motion-reviewer.md`) over `src/scenes/**` and
   `src/components/**`; apply findings about main-thread animations, per-frame
   allocation, `will-change` and deprecated `useTransform` signatures.

4. **Accessibility.**
   - axe DevTools on `/`, every lesson's first and last beat: no serious or
     critical issues.
   - Keyboard-only walkthrough of every lesson: every control reachable,
     every drag has a key equivalent, focus never lost on beat change, the
     check card is operable, dialogs trap and restore focus.
   - Screen reader spot check (NVDA or VoiceOver) on three lessons: scene
     `aria-label` is announced on beat change via an `aria-live="polite"`
     region in the shell; readouts announce without flooding (debounce 400 ms).
   - Colour independence: critical items thicker, overloads hatched, feedback
     rings, zone labels on the fever chart.

5. **Performance.**
   - `pnpm build`: every lesson route's first-load JS under 180 kB gzipped and
     exactly one lesson chunk per route; `motion` must not be duplicated across
     chunks.
   - Lighthouse mobile on `/`, `/learn/monte-carlo`, `/learn/kanban`:
     performance at least 95, accessibility 100, CLS 0.
   - Performance panel at 4× playback on the three flow lessons and during the
     RCPSP search animation: no long task over 50 ms, 55 fps or better.
   - Engine budgets in tests: Monte Carlo 5000 runs under 100 ms, RCPSP
     exhaustive under 150 ms, line simulator 80 ticks under 5 ms, critical
     chain `bestFeasible` under 50 ms.

6. **End-to-end smoke test.** `pnpm add -D @playwright/test`,
   `pnpm exec playwright install chromium`, `playwright.config.ts` with
   `pnpm build && pnpm start` as the web server, `tests/e2e/lessons.spec.ts`:
   for every slug, open the lesson, assert the scene `aria-label` is present,
   press ArrowRight through every beat (assert the beat title changes each
   time), operate one control on the final beat, answer the check correctly,
   assert the Next link (or its absence on lesson 13), and fail on any console
   error or warning. Also: `/` has 13 cards, `/learn/nope` is 404, `n` moves
   to the next lesson. Script `"e2e": "playwright test"`; add
   `test-results/` and `playwright-report/` to `.gitignore`.

7. **Docs.** README: a screenshot (`docs/screenshot.png`), the lesson table
   with scenarios, "how a lesson is built" (engine → scene → beats → check),
   the quality bar, and all scripts (`dev`, `build`, `lint`, `typecheck`,
   `test`, `e2e`). Add `docs/plan/review-log.md` from step 2.

8. **Ship.** Commit (`chore: quality pass, e2e smoke test, docs`) and push.
   Optional: import the repository at vercel.com/new with no configuration and
   set `NEXT_PUBLIC_SITE_URL` to the deployed URL.

## Acceptance criteria

- [x] AC1: `pnpm e2e` passes in Chromium for all 13 lessons, `/`, the 404 route and the `n` shortcut, with zero console errors or warnings.
- [x] AC2: `docs/plan/review-log.md` lists every lesson with at least the per-beat checks from step 2 and every finding has a fix commit.
- [x] AC3: axe reports no serious or critical issues on `/` and on the first and last beat of every lesson; every control and drag has a verified keyboard path.
- [x] AC4: Lighthouse mobile scores are at least 95 performance and 100 accessibility on the three pages listed, with CLS 0.
- [x] AC5: Every lesson route's first-load JS is under 180 kB gzipped with one lesson chunk; the engine budget tests pass.
- [x] AC6: The Motion reviewer audit has been run and its findings are either fixed or recorded in the review log with a reason.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm e2e` pass on a clean clone.
