# PM Methods Interactive Course

## Outcome

The site feels like one continuous piece: route transitions, a landing page
that resumes where the learner left off, keyboard help, accessibility and
performance verified, an end-to-end smoke test over every lesson, metadata and
Open Graph images, and a final README. The repository is ready to deploy from
GitHub.

## Step-by-step

1. **Landing resume.** `src/components/site/lesson-map.tsx`: a "Continue"
   button at the top that links to `lastVisited()` (hidden until mounted and
   when nothing is stored); a progress ring `n/13`; a one-line chapter intro
   per chapter; completed cards show a tick in `ok`.

2. **Route transitions.** Wrap the lesson shell's left column and the scene
   panel in React's `ViewTransition` (`import { ViewTransition } from "react"`)
   with `default="lesson-swap"` and CSS in `globals.css`:
   `::view-transition-old(.lesson-swap)` / `::view-transition-new(.lesson-swap)`
   200ms ease-out crossfade. Read
   `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` first.
   Confirm Motion's in-page animations and the view transition do not both fire
   on the same element during a lesson-to-lesson navigation; unsupported
   browsers must simply not animate.

3. **Keyboard help.** `?` opens `src/components/site/shortcuts-dialog.tsx`
   (native `<dialog>`, `AnimatePresence` for the fade): `← →` beats, `n` / `p`
   next / previous lesson, `Esc` close. The header hint opens the same dialog.

4. **Accessibility pass.**
   - Every slider and segmented control has a visible label and
     `aria-valuetext`; every readout region has `aria-live="polite"`.
   - Every scene has an `aria-label` summarising its state (for example
     "Network diagram: critical path A B C F G H, 19 days").
   - Focus rings visible on all controls (`focus-visible:ring-2 ring-accent`).
   - Colour is never the only channel: critical bars are thicker, overload days
     carry a hatch pattern, feedback marks use a different glyph.
   - `prefers-reduced-motion`: verify every lesson with the DevTools emulation;
     scenes must still convey each beat's change through position and text, not
     only through the animation.
   - Run axe DevTools on `/` and three lesson pages; fix every serious issue.

5. **Performance pass.**
   - `pnpm build` and record the first-load JS per route; each lesson route must
     stay under 180 kB gzipped and ship exactly one lesson chunk (inspect
     `.next/` output or the build table).
   - Lighthouse (mobile) on `/` and `/learn/monte-carlo`: performance ≥ 95,
     accessibility 100, no CLS from scene panels (fix aspect ratios).
   - Run the installed `motion-reviewer` agent (`.claude/agents/motion-reviewer.md`)
     over `src/components/viz` and `src/content/lessons`; apply the findings
     that concern main-thread animations, per-frame allocations and `will-change`.

6. **End-to-end smoke test.** `pnpm add -D @playwright/test`, `pnpm exec playwright install chromium`,
   `playwright.config.ts` using `pnpm build && pnpm start` as the web server,
   `tests/e2e/lessons.spec.ts`: for every slug in `LESSONS`, open the page,
   press ArrowRight until the check card appears, select the correct answer,
   assert the "Next" link (or none on the last lesson), and fail on any console
   error. Also test `/` lists 13 cards and `/learn/nope` is a 404.
   Add `"e2e": "playwright test"` to `package.json` and `test-results/` to
   `.gitignore`.

7. **Metadata.** `src/app/opengraph-image.tsx` (site) and
   `src/app/learn/[slug]/opengraph-image.tsx` (lesson number, title, tagline)
   using `ImageResponse`; `src/app/sitemap.ts` from `LESSONS`;
   `src/app/icon.svg` replacing the template favicon; `metadataBase` set from
   `NEXT_PUBLIC_SITE_URL` with a localhost fallback.

8. **README final.** Add a screenshot of a lesson (`docs/screenshot.png`), the
   lesson table, "how a lesson is built" (engine → scene → beats), and the
   commands `dev`, `build`, `lint`, `typecheck`, `test`, `e2e`.

9. **Ship.** Commit (`feat: polish, e2e smoke test, metadata`) and push.
   Optional: import the GitHub repository at vercel.com/new (no configuration
   needed), then set `NEXT_PUBLIC_SITE_URL` to the deployed URL.

## Acceptance criteria

- [ ] AC1: `pnpm e2e` passes in Chromium for all 13 lessons, `/` and the 404 route, with zero console errors.
- [ ] AC2: Navigating from a lesson's "Next" link to the following lesson crossfades (Chromium) and still works without animation in a browser without the View Transitions API.
- [ ] AC3: `/` shows "Continue" pointing at the last visited lesson after visiting one and reloading; the progress ring matches the number of completed checks.
- [ ] AC4: axe reports no serious or critical issues on `/`, `/learn/cpm`, `/learn/rcpsp` and `/learn/kanban`; every control is reachable and operable with the keyboard alone, including matrix reordering and the shortcuts dialog.
- [ ] AC5: Lighthouse mobile scores on `/` and `/learn/monte-carlo` are ≥ 95 performance and 100 accessibility; CLS is 0 on lesson pages.
- [ ] AC6: Every lesson route's first-load JS is under 180 kB gzipped and includes only its own lesson chunk.
- [ ] AC7: `/opengraph-image` and `/learn/cpm/opengraph-image` return 1200×630 PNGs; `/sitemap.xml` lists 14 URLs.
- [ ] AC8: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm e2e` all pass on a clean clone.
