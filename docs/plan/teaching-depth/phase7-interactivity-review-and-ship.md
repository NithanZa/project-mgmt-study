# Teaching Depth

## Outcome

Every lesson is judged against an interactivity bar and fixed where it falls
short, the content test and the Playwright suite enforce the new primitives,
the README's quality bar documents them, and the full check suite (lint,
typecheck, unit, build, e2e) passes.

Interactivity bar (the course owner's constraint: teach better without "just
adding a bunch of text"):

- Every beat has at least one hands-on element: a control, a drag or hover
  affordance in the scene, a spotlight term, or a predict. A beat whose only
  addition is a why is not acceptable.
- Every lesson has a recap and at least one predict, at most three.
- No beat body exceeds two sentences / forty words; no why exceeds forty
  words.
- Every `Term` id lights at least one visible `[data-spot]` element on its
  beat (enforced end to end).

## Step-by-step

1. **Tighten the content test** `src/content/teaching.test.ts`: `recap`
   becomes required for every lesson, and every lesson must have between one
   and three beats with a `predict`. The per-beat hands-on rule (control,
   scene hover or drag, term, or predict) needs a browser, so it is checked
   by hand in step 3 and recorded in the review log.

2. **Extend the e2e smoke test** `tests/e2e/lessons.spec.ts` inside the
   per-lesson test, for every beat while stepping through:
   - collect `article button[data-term]:visible` ids; for each, hover it and
     assert `section[aria-label="Interactive model"]:visible [data-spot~="<id>"]` (readouts carry `data-spotlight` too, so include them)
     has at least one visible element with `data-lit` set, then move the mouse
     away and assert `data-spotlight` is gone from `[data-scene]`;
   - if a `fieldset:visible` with legend "Predict" is present, pick its
     correct option (import `lesson.beats[i].predict` through `loadLesson`)
     and assert "Right." appears;
   - if a "Why?" button is visible, click it and assert `aria-expanded` is
     `true`;
   - on the last beat, assert the recap list has between 3 and 6 items and
     that clicking the first step's button changes the step counter to that
     beat, then return to the last beat with the dots.
   Keep the console guard; new warnings fail the run.

3. **Review every lesson** against the interactivity bar in the browser, one
   beat at a time, and record findings in `docs/plan/review-log.md` under a
   new heading "Teaching depth review" using the existing table columns
   (lesson, beat, finding, fix). Fix each finding in that lesson's files. Pay
   particular attention to: DSM beat `diagonal` (it must have spotlight terms,
   not only a why), fast-tracking `risk`, crashing `overhead`, rcpsp `rule`,
   critical-chain `feeding`, toc `subordinate`, kanban `cfd`.

4. **README.** In the "Quality bar" section add a bullet "**Teaching.**" that
   states the four primitives in one sentence each and the rules from the
   interactivity bar above. In "How a lesson is built", extend layer 3 with
   "spotlight terms, at most three predicts, whys where a result needs its
   mechanism, and a recap". Update the lessons table only if a scenario name
   changed (none should).

5. **Motion audit.** Run the installed `motion-reviewer` agent over
   `src/components/lesson/` and the scene files touched in phases 2 to 6;
   apply findings about per-frame allocation, main-thread animation and
   anything running longer than 600 ms. The spotlight pulse is 600 ms once
   and CSS-only.

6. **Full check.** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
   then `pnpm e2e` (builds and serves on port 3300; Playwright's Chromium is
   installed on this machine). Fix anything that fails. Confirm every lesson
   route's first-load JS is still under 180 kB gzipped in the build output.

## Acceptance criteria

- [x] AC1: `src/content/teaching.test.ts` requires a recap and one to three predicts for every lesson and passes.
- [x] AC2: `tests/e2e/lessons.spec.ts` hovers every `Term` on every beat of every lesson and asserts a lit `[data-spot]`, answers every predict, opens every why, and exercises the recap jump; `pnpm e2e` passes.
- [x] AC3: `docs/plan/review-log.md` has a "Teaching depth review" section with one row per lesson at minimum, and every beat of every lesson has at least one hands-on element (control, scene hover or drag, term, or predict).
- [x] AC4: README's quality bar documents the four primitives and the interactivity rules.
- [x] AC5: The motion-reviewer findings on the touched files are applied or recorded as not fixed with a reason in the review log.
- [ ] AC6: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm e2e` pass, and every lesson route's first-load JS is under 180 kB gzipped.
