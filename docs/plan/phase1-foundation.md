# PM Methods Interactive Course

## Outcome

The app shell, design system, lesson framework, progress store, landing page and
test tooling exist and are wired end to end through one stub lesson at
`/learn/cpm`. After this phase, adding a lesson means adding one module under
`src/content/lessons/` and nothing else.

Product shape (fixed for all later phases):

- 13 lessons: Critical Path Method (CPM) as the baseline, then the 12 methods.
  One idea per lesson, 4 to 5 "beats" (steps), one interactive scene per lesson
  that morphs between beats, one check question at the end. Target: under ten
  minutes per lesson.
- Two shared toy models reused across lessons so the learner never re-learns a
  diagram: the **Launch project** (8 tasks, a task network) for lessons 1 to 9
  and a **four-station work line** for lessons 10 to 13. Fixtures live in
  `src/engine/fixtures/` (phase 2 and phase 5).
- Stack: Next.js 16 App Router (`cacheComponents` on, every page static),
  React 19.3, Tailwind v4 tokens, Motion 14 (`motion/react`). No UI kit.
  Pure TypeScript engines under `src/engine/`, unit tested with Vitest.

Lesson registry (number, slug, title, chapter):

| #  | slug                | title                                   | chapter                    |
| -- | ------------------- | --------------------------------------- | -------------------------- |
| 1  | `cpm`               | Critical Path Method                    | I. The baseline            |
| 2  | `pert`              | PERT                                    | II. Time under uncertainty |
| 3  | `monte-carlo`       | Monte Carlo Schedule Simulation         | II. Time under uncertainty |
| 4  | `fast-tracking`     | Fast Tracking                           | III. Going faster          |
| 5  | `crashing`          | Project Crashing                        | III. Going faster          |
| 6  | `dsm`               | Design Structure Matrix                 | III. Going faster          |
| 7  | `resource-leveling` | Resource Leveling                       | IV. Limited people         |
| 8  | `rcpsp`             | Resource-Constrained Project Scheduling | IV. Limited people         |
| 9  | `critical-chain`    | Critical Chain (CCPM)                   | IV. Limited people         |
| 10 | `toc`               | Theory of Constraints                   | V. Flow, not tasks         |
| 11 | `dbr`               | Drum-Buffer-Rope                        | V. Flow, not tasks         |
| 12 | `kanban`            | Kanban and WIP Limits                   | V. Flow, not tasks         |
| 13 | `vsm`               | Value Stream Mapping                    | V. Flow, not tasks         |

## Step-by-step

1. **Tooling.** `pnpm add -D vitest` (5.x). Add scripts to `package.json`:
   `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`. Create
   `vitest.config.ts` with `test.include: ["src/**/*.test.ts"]` and the `@`
   alias to `./src` (no React plugin: only engines are unit tested).
   `.gitattributes` (`* text=auto eol=lf`) is already committed.
   Next 16 conventions differ from older versions: before writing routes read
   `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
   (global `PageProps<'/learn/[slug]'>` and `LayoutProps<'/'>` helpers, `params`
   is a Promise) and `05-server-and-client-components.md`.

2. **Remove boilerplate.** Delete `public/*.svg`. Replace `src/app/page.tsx`
   (step 10). In `src/app/globals.css` delete the `body { font-family: Arial }`
   rule so Geist applies through `--font-sans`; keep the `@theme inline` font
   mapping. Set `metadata` in `src/app/layout.tsx`:
   `title: { default: "PM Methods", template: "%s · PM Methods" }`.

3. **Design tokens** in `src/app/globals.css`. Define light values on `:root`,
   dark values under `@media (prefers-color-scheme: dark)` (no toggle), and map
   them in `@theme inline` so Tailwind utilities exist (`bg-bg`, `text-muted`,
   `stroke-accent`, ...). Roles:
   - `bg`, `surface` (cards and the scene panel), `fg`, `muted` (secondary text),
     `line` (hairlines).
   - `accent`: the critical path and primary actions (one saturated blue).
   - `float`: slack and non-critical work (desaturated blue-gray).
   - `buffer`: CCPM and DBR buffers (amber).
   - `constraint`: bottlenecks, overloads and feedback marks (coral red).
   - `ok`: completed and feasible states (green).
   Take hex values from the `dataviz` skill palette (`references/palette.md`)
   and check text contrast is at least 4.5:1 in both schemes. Add
   `--radius-md: 0.75rem`, `--radius-lg: 1.25rem`. Scenes use only these tokens.

4. **Motion provider.** `src/components/providers.tsx` (`"use client"`) renders
   `<MotionConfig reducedMotion="user" transition={{ type: "spring", bounce: 0.2, visualDuration: 0.4 }}>`.
   Wrap `{children}` with it in `src/app/layout.tsx`. All animation imports
   come from `motion/react` inside client components (see
   `.claude/skills/motion/best-practices/react.md`).

5. **Content model.** `src/content/types.ts`:
   ```ts
   export type Slug = "cpm" | "pert" | "monte-carlo" | "fast-tracking" | "crashing" | "dsm"
     | "resource-leveling" | "rcpsp" | "critical-chain" | "toc" | "dbr" | "kanban" | "vsm";
   export type ChapterId = "baseline" | "uncertainty" | "faster" | "people" | "flow";
   export interface Chapter { id: ChapterId; numeral: string; title: string; blurb: string }
   export interface LessonMeta { slug: Slug; number: number; title: string; tagline: string; improves: string; chapter: ChapterId }
   export interface Beat { id: string; title: string; body: ReactNode }   // body: at most two sentences
   export interface Check { question: string; options: string[]; answer: number; why: string }
   export interface SceneProps { beat: number }                            // index into beats
   export interface Lesson { meta: LessonMeta; beats: Beat[]; Scene: ComponentType<SceneProps>; check: Check }
   ```
   `src/content/meta.ts` exports `CHAPTERS: Chapter[]` and `LESSONS: LessonMeta[]`
   (the 13 rows above; `tagline` = the one-sentence core insight from the
   brief, `improves` = the "what it improves" phrase) plus helpers
   `lessonBySlug(slug)`, `nextLesson(slug)`, `prevLesson(slug)`.

6. **Lesson registry with per-route code splitting.**
   `src/content/lessons/index.ts` exports
   `LESSON_COMPONENTS: Record<Slug, ComponentType>` built with `next/dynamic`,
   one `dynamic(() => import("./cpm"))` per slug. Each lesson module
   (`src/content/lessons/<slug>.tsx`, `"use client"`) default-exports a
   component that renders `<LessonShell lesson={lesson} />`. Slugs without a
   module yet map to `src/components/lesson/coming-soon.tsx` (removed in
   phase 6). The server page never receives a function prop; it only picks the
   component by slug, so each lesson ships in its own chunk.

7. **Lesson route.** `src/app/learn/[slug]/page.tsx` (server):
   `generateStaticParams` from `LESSONS`; `generateMetadata` from the meta
   (title, description = tagline); `notFound()` for unknown slugs; render
   `<LessonComponent />`. Add `src/app/not-found.tsx`.

8. **Lesson shell.** `src/components/lesson/lesson-shell.tsx` (`"use client"`),
   props `{ lesson: Lesson }`:
   - Layout: `grid lg:grid-cols-[minmax(20rem,26rem)_1fr] gap-8`. Left column:
     chapter label, lesson number and title, the current beat (title + body),
     beat dots, Prev / Next buttons. Right column: the scene inside a `surface`
     panel with `rounded-lg`, `aspect-[4/3]` under `lg`, full height on `lg`.
     On mobile the panel is `sticky top-0` and the prose scrolls beneath it.
   - Beat text swaps inside `<AnimatePresence mode="wait">` keyed by `beat.id`
     (opacity 0 to 1, `y` 6px to 0, 180ms). The scene is **never** remounted
     between beats; it receives `beat` and animates its own change.
   - Keyboard: ArrowRight / ArrowLeft move beats unless `event.target` is an
     input, textarea, select or slider. Buttons show `kbd` hints.
   - Last beat appends `src/components/lesson/check-card.tsx` (question, options
     as radio buttons, reveal `why`, mark complete on a correct answer) and a
     "Next: <title>" link; the first lesson has no Prev-lesson link and the last
     has no Next.
   - Reads and writes the beat index and completion through the progress store.

9. **Progress store.** `src/lib/progress.ts`: `localStorage` key
   `pms.progress.v1` holding `{ [slug]: { beat: number; completed: boolean } }`.
   Expose `useProgress()` via `useSyncExternalStore` (server snapshot = empty
   object so SSR output matches the first client render), `setBeat(slug, beat)`,
   `markComplete(slug)`, `lastVisited()`.

10. **Landing page** `src/app/page.tsx` (server) rendering
    `src/components/site/lesson-map.tsx` (client, for progress ticks): hero
    ("Thirteen ways to finish sooner." plus one sub-line), then the five
    chapters, each with its blurb and lesson cards (number, title, tagline,
    `improves` tag, done tick). Cards: `Link` wrapping `motion.div` with
    `whileHover={{ y: -2 }}` and a 25ms mount stagger via variants.

11. **Site chrome.** `src/components/site/header.tsx`: wordmark link to `/`,
    completed count `n/13` (client), and on lesson pages a `← →` hint.

12. **UI primitives** in `src/components/ui/`: `button.tsx` (primary / ghost),
    `slider.tsx` (label, unit, native `<input type="range">` styled with the
    `accent` token, `aria-valuetext`), `segmented.tsx` (radio group rendered as
    pills with a `layoutId` indicator), `toggle.tsx`, `kbd.tsx`, and
    `readout.tsx`: label plus an animated number driven by
    `useMotionValue` + `animate()` and rendered as `<motion.span>{display}</motion.span>`
    where `display = useTransform(() => value.get().toFixed(digits))`. Never
    read a MotionValue during render.

13. **Stub lesson** `src/content/lessons/cpm.tsx`: three placeholder beats and
    a `Scene` that shows a different arrangement of three `layoutId` boxes per
    beat, proving the morph pipeline (replaced in phase 3).

14. **README.** Replace the template README: purpose, the lesson list, scripts
    (`dev`, `build`, `lint`, `typecheck`, `test`), and the folder layout
    (`src/app`, `src/components`, `src/content`, `src/engine`, `src/lib`).

15. Commit (`feat: app shell, design tokens, lesson framework`) and push.

## Acceptance criteria

- [ ] AC1: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all exit 0; the build output lists `/` and all 13 `/learn/<slug>` routes as prerendered static pages.
- [ ] AC2: `/` shows 5 chapters and 13 cards in the order of the registry table; every card links to its `/learn/<slug>` route; `/learn/nope` returns the 404 page.
- [ ] AC3: On `/learn/cpm`, ArrowRight, ArrowLeft and the Prev / Next buttons change the beat; the prose cross-fades and the stub scene boxes move with a layout animation instead of remounting (verified by a `useEffect` log on mount firing once).
- [ ] AC4: On the last beat the check card appears; choosing the correct option reveals `why`, and `/` then shows a done tick on the CPM card and `1/13` in the header after a reload.
- [ ] AC5: Reloading `/learn/cpm` restores the last beat index from `localStorage`; the first SSR render produces no hydration warning in the console.
- [ ] AC6: With the OS "reduce motion" setting on, beat changes only fade (no translate), confirmed in DevTools by emulating `prefers-reduced-motion`.
- [ ] AC7: At a 375px viewport the scene panel sticks to the top, the prose scrolls beneath it and the page has no horizontal overflow; at 1280px the two-column layout renders with the scene filling the right column.
- [ ] AC8: Text colours pass 4.5:1 contrast in light and dark schemes (checked with the DevTools contrast tool on body, muted and accent-on-surface text).
