# PM Methods Interactive Course

## Outcome

The app shell, design system, lesson framework, progress store and test tooling
exist and are proven end to end with a placeholder lesson at `/learn/cpm`.
Every later phase adds exactly one lesson: its own scenario, its own engine, its
own scene and its own copy. Nothing visual is shared between lessons. The only
shared code is the shell, the UI primitives in `src/components/ui/` and small
utilities in `src/lib/` (random numbers, statistics, number formatting, and a
line simulator created in phase 11 that the three flow lessons configure with
their own fixtures and render with their own scenes).

Stack: Next.js 16 App Router (`cacheComponents` on, every page static),
React 19.3, Tailwind v4 tokens, Motion 14 from `motion/react`, Vitest for
engines, Playwright for the end-to-end smoke test (phase 16). No UI kit.

Lesson registry (number, slug, title, chapter, scenario):

| #  | slug                | title                                   | chapter                    | scenario                     |
| -- | ------------------- | --------------------------------------- | -------------------------- | ---------------------------- |
| 1  | `cpm`               | Critical Path Method                    | I. The baseline            | Opening a coffee shop        |
| 2  | `pert`              | PERT                                    | II. Time under uncertainty | A database migration         |
| 3  | `monte-carlo`       | Monte Carlo Schedule Simulation         | II. Time under uncertainty | A conference launch          |
| 4  | `fast-tracking`     | Fast Tracking                           | III. Going faster          | Building a house             |
| 5  | `crashing`          | Project Crashing                        | III. Going faster          | A trade show booth           |
| 6  | `dsm`               | Design Structure Matrix                 | III. Going faster          | Developing a bike            |
| 7  | `resource-leveling` | Resource Leveling                       | IV. Limited people         | Three features, one designer |
| 8  | `rcpsp`             | Resource-Constrained Project Scheduling | IV. Limited people         | A game jam team              |
| 9  | `critical-chain`    | Critical Chain (CCPM)                   | IV. Limited people         | A website redesign           |
| 10 | `toc`               | Theory of Constraints                   | V. Flow, not tasks         | A bakery line                |
| 11 | `dbr`               | Drum-Buffer-Rope                        | V. Flow, not tasks         | A machine shop               |
| 12 | `kanban`            | Kanban and WIP Limits                   | V. Flow, not tasks         | A product team board         |
| 13 | `vsm`               | Value Stream Mapping                    | V. Flow, not tasks         | Hiring an engineer           |

Quality bar (every lesson phase is checked against this list):

- **Copy.** A beat title states the takeaway in at most eight words. A beat body
  is at most two sentences and forty words. A term appears in copy only after
  the scene has shown it. Every number in copy is read from the engine at
  render time, never typed by hand.
- **Scene.** One focal change per beat. The canvas persists across beats and
  animates its change; it never remounts. The thing being explained is the
  largest element. Readouts sit top-right, controls bottom, and controls only
  mount on beats that use them. Labels and numbers are the only text inside a
  scene.
- **Motion.** Position and size use `type: "spring", bounce: 0.2, visualDuration: 0.4`.
  Opacity uses 180 ms ease-out. Staggers are at most 30 ms per item. Nothing
  except playback runs longer than 600 ms. Only transforms, opacity, `layout`
  and SVG path data animate. `MotionConfig reducedMotion="user"` is respected
  and every beat change still reads without motion.
- **Interaction.** Every control has a visible label, a unit and keyboard
  operation. Sliders snap to whole units unless the phase says otherwise.
  Anything the learner can break has a Reset.
- **Accessibility.** Each scene exposes an `aria-label` that summarises its
  current state. Readout groups are `aria-live="polite"`. Colour is never the
  only channel: critical items are also thicker, overloads are hatched,
  feedback marks use a different glyph.
- **Performance.** Engines run in `useMemo` or `startTransition`. Per-frame code
  allocates nothing. Any interaction recomputes in under 50 ms on a laptop.

## Step-by-step

1. **Tooling.** `pnpm add -D vitest`. Scripts in `package.json`:
   `"test": "vitest run"`, `"test:watch": "vitest"`, `"typecheck": "tsc --noEmit"`.
   `vitest.config.ts`: `test.include: ["src/**/*.test.ts"]`, alias `@` to `./src`.
   Read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
   (global `PageProps<'/learn/[slug]'>` and `LayoutProps<'/'>` helpers; `params`
   is a Promise) and `05-server-and-client-components.md` before writing routes.
   Read `.claude/skills/motion/best-practices/react.md` before writing any
   animation.

2. **Remove boilerplate.** Delete `public/*.svg`. In `src/app/globals.css`
   delete the `body { font-family: Arial }` rule so Geist applies through
   `--font-sans`. Set `metadata` in `src/app/layout.tsx` to
   `{ title: { default: "PM Methods", template: "%s · PM Methods" }, description: "Thirteen scheduling and flow methods, each taught with one interactive model." }`.

3. **Design tokens** in `src/app/globals.css`: light values on `:root`, dark
   values under `@media (prefers-color-scheme: dark)`, mapped in `@theme inline`
   so utilities such as `bg-surface`, `text-muted`, `stroke-accent` exist.
   Roles: `bg`, `surface`, `surface-2` (nested panels), `fg`, `muted`, `line`,
   `accent` (critical, primary action), `accent-soft` (accent at 15% for fills),
   `float` (slack, non-critical), `buffer` (amber: buffers, warnings), `constraint`
   (coral: bottlenecks, overloads, feedback), `ok` (green). Take hex values from
   the `dataviz` skill palette and verify 4.5:1 contrast for all text roles in
   both schemes. Radii `--radius-md: 0.75rem`, `--radius-lg: 1.25rem`. A hatch
   pattern utility `.hatch` (repeating-linear-gradient at 45°) for overloads.

4. **Motion provider.** `src/components/providers.tsx` (`"use client"`) with
   `<MotionConfig reducedMotion="user" transition={{ type: "spring", bounce: 0.2, visualDuration: 0.4 }}>`;
   wrap `{children}` in `src/app/layout.tsx`.

5. **Content model** `src/content/types.ts`:
   ```ts
   export type Slug = "cpm" | "pert" | "monte-carlo" | "fast-tracking" | "crashing" | "dsm"
     | "resource-leveling" | "rcpsp" | "critical-chain" | "toc" | "dbr" | "kanban" | "vsm";
   export type ChapterId = "baseline" | "uncertainty" | "faster" | "people" | "flow";
   export interface Chapter { id: ChapterId; numeral: string; title: string; blurb: string }
   export interface LessonMeta { slug: Slug; number: number; title: string; tagline: string; improves: string; scenario: string; chapter: ChapterId }
   export interface Beat { id: string; title: string; body: ReactNode }
   export interface Check { question: string; options: string[]; answer: number; why: string }
   export interface SceneProps { beat: number }
   export interface Lesson { meta: LessonMeta; beats: Beat[]; Scene: ComponentType<SceneProps>; Thumbnail: ComponentType; check: Check }
   ```
   `Thumbnail` is a static SVG preview of the scene used by the course map
   (phase 15). `src/content/meta.ts` exports `CHAPTERS`, `LESSONS` (13 rows
   above; `tagline` is the core insight from the brief, `improves` the "what
   it improves" phrase) and `lessonBySlug`, `nextLesson`, `prevLesson`.

6. **Registry with per-route code splitting** `src/content/lessons/index.ts`:
   `LESSON_COMPONENTS: Record<Slug, ComponentType>` built with one
   `dynamic(() => import("./cpm"))` per slug, so each lesson ships in its own
   chunk. Each `src/content/lessons/<slug>.tsx` (`"use client"`) exports
   `lesson: Lesson` and default-exports a component rendering
   `<LessonShell lesson={lesson} />`. Slugs without a module map to
   `src/components/lesson/coming-soon.tsx` until their phase lands.

7. **Routes.** `src/app/learn/[slug]/page.tsx` (server): `generateStaticParams`
   from `LESSONS`, `generateMetadata` (title, description = tagline),
   `notFound()` for unknown slugs, render the registry component.
   `src/app/not-found.tsx` with a link home. `src/app/page.tsx` is a minimal
   list of the 13 lessons for now (the real course map is phase 15).

8. **Lesson shell** `src/components/lesson/lesson-shell.tsx` (`"use client"`):
   - `grid lg:grid-cols-[minmax(20rem,26rem)_1fr] gap-8`. Left: chapter label,
     "Lesson n · Title", scenario line, the beat (title + body), beat dots,
     Prev / Next with `kbd` hints. Right: the scene in a `surface` panel,
     `rounded-lg`, `aspect-[4/3]` below `lg`, full height on `lg`; on mobile the
     panel is `sticky top-0` and the prose scrolls under it.
   - Beat copy swaps in `<AnimatePresence mode="wait">` keyed by `beat.id`
     (opacity 0 to 1, `y` 6 to 0, 180 ms). The scene stays mounted and
     receives `beat`.
   - Keyboard: ArrowLeft / ArrowRight change beats unless focus is in an input,
     textarea, select, slider or `[contenteditable]`.
   - On the last beat append `check-card.tsx` (radio options, reveal `why`,
     mark complete on a correct answer) and the Next-lesson link.
   - Beat index and completion go through the progress store.

9. **Scene frame** `src/components/lesson/scene-frame.tsx`: padding, a
   top-right readout strip and a bottom control strip that mounts with
   `AnimatePresence` (`height: 0` to `"auto"`, `overflow: hidden`) only when the
   current beat passes controls. Scenes are 4:3 and lay out with CSS grid; SVG
   parts use a `viewBox` so they scale.

10. **Progress store** `src/lib/progress.ts`: `localStorage` key
    `pms.progress.v1`, shape `{ [slug]: { beat: number; completed: boolean; visitedAt: number } }`,
    `useProgress()` through `useSyncExternalStore` with an empty server
    snapshot, plus `setBeat`, `markComplete`, `lastVisited`.

11. **UI primitives** `src/components/ui/`: `button.tsx` (primary, ghost, icon),
    `slider.tsx` (label, unit, min, max, step, native range styled with
    `accent`, `aria-valuetext`), `segmented.tsx` (radio group as pills with a
    `layoutId` indicator), `toggle.tsx`, `kbd.tsx`, `readout.tsx` (label plus an
    animated number: `useMotionValue` + `animate()`, rendered as
    `<motion.span>{display}</motion.span>` with
    `display = useTransform(() => format(value.get()))`; never read a
    MotionValue during render), `legend.tsx` (swatch + label rows).

12. **Shared utilities** `src/lib/format.ts` (`days(n)`, `money(n)`, `pct(x)`),
    `src/lib/random.ts` (`mulberry32`, `normal`, `gamma` with Marsaglia-Tsang,
    `betaPert(o, m, p, rng)`), `src/lib/stats.ts` (`normalCdf`,
    `normalQuantile` by bisection, `quantile(sorted, p)`, `mean`, `stddev`).
    Each with a test file.

13. **Placeholder lesson** `src/content/lessons/cpm.tsx` with three beats and a
    scene of three `layoutId` boxes that rearrange per beat, proving the morph
    pipeline. Phase 2 replaces it.

14. **README**: purpose, the lesson table, scripts, folder layout
    (`src/app`, `src/components`, `src/content`, `src/scenes/<slug>`,
    `src/engine/<slug>`, `src/lib`), and the quality bar above.

15. Commit (`feat: app shell, design tokens, lesson framework`) and push.

## Acceptance criteria

- [ ] AC1: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` exit 0; the build lists `/` and all 13 `/learn/<slug>` routes as static.
- [ ] AC2: `/learn/cpm` renders the placeholder; ArrowRight / ArrowLeft and the buttons change beats; the copy cross-fades; the boxes move with a layout animation and the scene mounts exactly once per visit (verified with a mount log).
- [ ] AC3: The last beat shows the check card; a correct answer reveals `why` and `/` shows the lesson as completed after reload.
- [ ] AC4: Reloading restores the beat index; no hydration warning appears in the console.
- [ ] AC5: With `prefers-reduced-motion` emulated, beat changes only fade.
- [ ] AC6: At 375 px the scene panel is sticky and there is no horizontal overflow; at 1280 px the two-column layout renders.
- [ ] AC7: All text roles pass 4.5:1 contrast in both colour schemes.
- [ ] AC8: `src/lib/random.test.ts` shows `betaPert(3, 5, 9)` has a sample mean within 0.05 of 5.33 over 20 000 draws, and `stats.test.ts` shows `normalCdf(0.8)` within 1e-4 of 0.7881.
